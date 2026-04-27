import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import { RedisTokenService } from './redis-token.service';
import { CreateUserDto } from '../../users/dto/user.dto';
import type { LoginDto } from '../dto/auth.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisTokenService: RedisTokenService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: CreateUserDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const user = await this.usersService.create(dto);
    const tokens = await this.generateTokens(user.id);

    return {
      tokens,
      user: this.usersService.toResponseDto(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id);

    return {
      tokens,
      user: this.usersService.toResponseDto(user),
    };
  }

  async refresh(refreshToken: string) {
    const accessSecret = this.configService.get('JWT_ACCESS_SECRET');
    if (!accessSecret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }

    const refreshSecret = this.configService.get('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }

    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token has expired');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await this.redisTokenService.isRefreshTokenValid(
      refreshToken,
    );
    if (!isValid) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const accessToken = this.jwtService.sign(
      { sub: payload.sub },
      {
        secret: accessSecret,
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION') ?? '15m',
      },
    );

    return { accessToken };
  }

  async logout(refreshToken: string) {
    if (refreshToken) {
      await this.redisTokenService.revokeRefreshToken(refreshToken);
    }
  }

  async getUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.usersService.toResponseDto(user);
  }

  private async generateTokens(userId: string): Promise<TokenPair> {
    const accessToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION') ?? '15m',
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') ?? '7d',
      },
    );

    const refreshExpiresIn = 7 * 24 * 60 * 60;
    await this.redisTokenService.storeRefreshToken(
      refreshToken,
      userId,
      refreshExpiresIn,
    );

    return { accessToken, refreshToken };
  }
}