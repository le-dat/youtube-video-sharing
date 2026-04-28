/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../../users/users.service';
import { RedisTokenService } from './redis-token.service';
import { User } from '../../users/entities/user.entity';
import { UserResponseDto } from '../../users/dto/user.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let redisTokenService: jest.Mocked<RedisTokenService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      validatePassword: jest.fn(),
      toResponseDto: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      signAsync: jest.fn(),
      verify: jest.fn(),
    };

    const mockRedisTokenService = {
      storeRefreshToken: jest.fn(),
      isRefreshTokenValid: jest.fn(),
      revokeRefreshToken: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RedisTokenService, useValue: mockRedisTokenService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    redisTokenService = module.get(RedisTokenService);
    configService = module.get(ConfigService);
  });

  describe('register', () => {
    it('should throw ConflictException if usersService.create fails', async () => {
      usersService.create.mockRejectedValue(
        new ConflictException('Email already exists'),
      );

      await expect(
        authService.register({
          username: 'test',
          email: 'test@example.com',
          password: 'password',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user and return tokens', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'test',
        email: 'test@example.com',
      };
      usersService.create.mockResolvedValue(mockUser as unknown as User);
      usersService.toResponseDto.mockReturnValue(
        mockUser as unknown as UserResponseDto,
      );
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      redisTokenService.storeRefreshToken.mockResolvedValue(undefined);
      configService.get.mockReturnValue('secret');

      const result = await authService.register({
        username: 'test',
        email: 'test@example.com',
        password: 'password',
      });

      expect(result.user.username).toBe('test');
      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.tokens.refreshToken).toBe('refresh-token');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: '1',
      } as unknown as User);
      usersService.validatePassword.mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens for valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'test',
        email: 'test@example.com',
      };
      usersService.findByEmail.mockResolvedValue(mockUser as unknown as User);
      usersService.validatePassword.mockResolvedValue(true);
      usersService.toResponseDto.mockReturnValue(
        mockUser as unknown as UserResponseDto,
      );
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      redisTokenService.storeRefreshToken.mockResolvedValue(undefined);
      configService.get.mockReturnValue('secret');

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result.user.username).toBe('test');
    });
  });

  describe('refresh', () => {
    it('should throw if JWT_ACCESS_SECRET is not configured', async () => {
      configService.get.mockReturnValue(undefined);

      await expect(authService.refresh('some-token')).rejects.toThrow(
        'JWT_ACCESS_SECRET is not configured',
      );
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      configService.get
        .mockReturnValueOnce('access-secret')
        .mockReturnValueOnce('refresh-secret');
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return new access token for valid refresh token', async () => {
      configService.get
        .mockReturnValueOnce('access-secret')
        .mockReturnValueOnce('refresh-secret');
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
      redisTokenService.isRefreshTokenValid.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('new-access-token');

      const result = await authService.refresh('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
    });

    it('should throw UnauthorizedException if refresh token expired', async () => {
      configService.get
        .mockReturnValueOnce('access-secret')
        .mockReturnValueOnce('refresh-secret');

      const expiredError = new Error('jwt expired');
      expiredError.name = 'TokenExpiredError';
      jwtService.verify.mockImplementation(() => {
        throw expiredError;
      });

      await expect(authService.refresh('expired-token')).rejects.toThrow(
        'Refresh token has expired',
      );
    });
  });

  describe('logout', () => {
    it('should revoke refresh token if provided', async () => {
      redisTokenService.revokeRefreshToken.mockResolvedValue(undefined);

      await authService.logout('refresh-token');

      expect(redisTokenService.revokeRefreshToken).toHaveBeenCalledWith(
        'refresh-token',
      );
    });

    it('should do nothing if no refresh token provided', async () => {
      await authService.logout('');

      expect(redisTokenService.revokeRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('getUser', () => {
    it('should return UserResponseDto when user is found', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'test',
        email: 'test@example.com',
        createdAt: new Date(),
      };
      usersService.findById.mockResolvedValue(mockUser as unknown as User);
      usersService.toResponseDto.mockReturnValue({
        id: 'user-1',
        username: 'test',
        email: 'test@example.com',
        createdAt: mockUser.createdAt,
      });

      const result = await authService.getUser('user-1');

      expect(usersService.findById).toHaveBeenCalledWith('user-1');
      expect(result.username).toBe('test');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(authService.getUser('non-existent')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
