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
      // Giả lập tìm thấy email trùng
      repository.findOne.mockResolvedValueOnce({ id: '1' } as User);

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('Email already exists'),
      );
    });

    it('should throw ConflictException if username already exists', async () => {
      // Lần 1 tìm email: trả về null (không trùng)
      repository.findOne.mockResolvedValueOnce(null);
      // Lần 2 tìm username: trả về user (trùng)
      repository.findOne.mockResolvedValueOnce({ id: '1' } as User);

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('Username already exists'),
      );
    });

    it('should create a user successfully with username containing spaces', async () => {
      repository.findOne.mockResolvedValue(null); // Không trùng cái nào
      repository.create.mockReturnValue(createUserDto as unknown as User);
      repository.save.mockResolvedValue({
        id: 'uuid',
        ...createUserDto,
      } as unknown as User);

      const result = await service.create(createUserDto);

      expect(result.username).toBe('le dat');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'le dat',
          email: 'test@example.com',
        }),
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.save).toHaveBeenCalled();
    });

    it('should hash the password before saving', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockImplementation((dto) => dto as any);
      repository.save.mockImplementation((user) => Promise.resolve(user as any));

      const result = await service.create(createUserDto);

      // Kiểm tra xem password đã được hash chưa (bcrypt hash thường bắt đầu bằng $2)
      expect(result.password).not.toBe(createUserDto.password);
      expect(result.password.startsWith('$2')).toBe(true);
    });
  });

  describe('findByEmail', () => {
    it('should call findOne with lowercase email', async () => {
      await service.findByEmail('Test@Example.Com');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('findByUsername', () => {
    it('should call findOne with exact username', async () => {
      await service.findByUsername('le dat');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username: 'le dat' },
      });
    });
  });
});
