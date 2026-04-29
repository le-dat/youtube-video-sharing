/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      getUser: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    mockConfigService = {
      get: jest.fn().mockReturnValue('development'),
    } as unknown as jest.Mocked<ConfigService>;

    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should register user and set cookies', async () => {
      const dto = {
        username: 'test',
        email: 'test@example.com',
        password: 'password',
      };
      const tokens = { accessToken: 'access', refreshToken: 'refresh' };
      const user = {
        id: 'user-1',
        username: 'test',
        email: 'test@example.com',
      };

      mockAuthService.register.mockResolvedValue({ tokens, user });
      mockResponse.cookie = jest.fn();

      const result = await controller.register(dto, mockResponse as Response);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(mockResponse.cookie).toHaveBeenCalled();
      expect(result.user).toEqual(user);
    });
  });

  describe('login', () => {
    it('should login user and set cookies', async () => {
      const dto = { email: 'test@example.com', password: 'password' };
      const tokens = { accessToken: 'access', refreshToken: 'refresh' };
      const user = {
        id: 'user-1',
        username: 'test',
        email: 'test@example.com',
      };

      mockAuthService.login.mockResolvedValue({ tokens, user });
      mockResponse.cookie = jest.fn();

      const result = await controller.login(dto, mockResponse as Response);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(mockResponse.cookie).toHaveBeenCalled();
      expect(result.user).toEqual(user);
    });
  });

  describe('refresh', () => {
    it('should refresh token and set both cookies', async () => {
      const mockRequest = { cookies: { refreshToken: 'valid-refresh' } };
      mockAuthService.refresh.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
      mockResponse.cookie = jest.fn();

      const result = await controller.refresh(
        mockRequest,
        mockResponse as Response,
      );

      expect(mockAuthService.refresh).toHaveBeenCalledWith('valid-refresh');
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        'new-access',
        expect.any(Object),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh',
        expect.any(Object),
      );
      expect(result.message).toBe('Token refreshed');
    });

    it('should throw UnauthorizedException when no refresh token', async () => {
      const mockRequest = { cookies: {} };

      await expect(
        controller.refresh(
          mockRequest as { cookies?: Record<string, string> },
          mockResponse as Response,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout and clear cookies', async () => {
      const mockRequest = { cookies: { refreshToken: 'refresh' } };
      mockAuthService.logout.mockResolvedValue(undefined);
      mockResponse.clearCookie = jest.fn();

      const result = await controller.logout(
        mockRequest,
        mockResponse as Response,
      );

      expect(mockAuthService.logout).toHaveBeenCalledWith('refresh');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'accessToken',
        expect.any(Object),
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(Object),
      );
      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const userDto = {
        id: 'user-1',
        username: 'test',
        email: 'test@example.com',
      };
      mockAuthService.getUser.mockResolvedValue(userDto);

      const result = await controller.getProfile('user-1');

      expect(mockAuthService.getUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(userDto);
    });
  });
});
