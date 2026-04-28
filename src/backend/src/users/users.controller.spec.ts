import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    mockUsersService = {
      findById: jest.fn(),
      toResponseDto: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed',
        createdAt: new Date(),
      };
      const userDto = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: mockUser.createdAt,
      };

      mockUsersService.findById.mockResolvedValue(mockUser as unknown as null);
      mockUsersService.toResponseDto.mockReturnValue(userDto);

      const result = await controller.getProfile('user-1');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockUsersService.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(userDto);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(controller.getProfile('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
