/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let mockUsersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    mockUsersService = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate', () => {
    it('should return user data when user exists', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      } as User;
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await strategy.validate({ sub: 'user-1' });

      expect(result).toEqual({
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      });
      expect(mockUsersService.findById).toHaveBeenCalledWith('user-1');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(strategy.validate({ sub: 'non-existent' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
