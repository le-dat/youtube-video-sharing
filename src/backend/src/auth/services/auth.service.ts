import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const isValid = await this.usersService.validatePassword(user, password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');
    return this.usersService.toResponseDto(user);
  }

  async login(userId: string, email: string) {
    const payload = { sub: userId, email };
    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn: 3600,
    };
  }
}