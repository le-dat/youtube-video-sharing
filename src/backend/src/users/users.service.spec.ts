/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  describe('create', () => {
    const createUserDto = {
      username: 'le dat',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should throw ConflictException if email already exists', async () => {
      repository.findOne.mockResolvedValueOnce({ id: '1' } as User);

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('Email already exists'),
      );
    });

    it('should throw ConflictException if username already exists', async () => {
      repository.findOne.mockResolvedValueOnce(null);
      repository.findOne.mockResolvedValueOnce({ id: '1' } as User);

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('Username already exists'),
      );
    });

    it('should create a user successfully with username containing spaces', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(createUserDto as unknown as User);
      repository.save.mockResolvedValue({
        id: 'uuid',
        ...createUserDto,
      } as unknown as User);

      const result = await service.create(createUserDto);

      expect(result.username).toBe('le dat');
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'le dat',
          email: 'test@example.com',
        }),
      );
      expect(repository.save).toHaveBeenCalled();
    });

    it('should hash the password before saving', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockImplementation((dto) => dto as User);
      repository.save.mockImplementation((user: User) => Promise.resolve(user));

      const result = await service.create(createUserDto);

      expect(result.password).not.toBe(createUserDto.password);
      expect(result.password.startsWith('$2')).toBe(true);
    });
  });

  describe('findByEmail', () => {
    it('should call findOne with lowercase email', async () => {
      await service.findByEmail('Test@Example.Com');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('findByUsername', () => {
    it('should call findOne with exact username', async () => {
      await service.findByUsername('le dat');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username: 'le dat' },
      });
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'test',
        email: 'test@example.com',
        password: 'hashed',
        createdAt: new Date(),
      } as User;
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });
});
