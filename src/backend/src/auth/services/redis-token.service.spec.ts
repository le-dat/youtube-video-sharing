import { Test, TestingModule } from '@nestjs/testing';
import { RedisTokenService } from './redis-token.service';
import { RedisService } from '../../config/redis.service';

describe('RedisTokenService', () => {
  let redisTokenService: RedisTokenService;
  let mockPipeline: {
    setex: jest.Mock;
    sadd: jest.Mock;
    expire: jest.Mock;
    del: jest.Mock;
    exec: jest.Mock;
    srem: jest.Mock;
    smembers: jest.Mock;
    exists: jest.Mock;
    get: jest.Mock;
  };

  beforeEach(async () => {
    mockPipeline = {
      setex: jest.fn().mockReturnThis(),
      sadd: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      srem: jest.fn().mockReturnThis(),
      smembers: jest.fn().mockReturnThis(),
      exists: jest.fn().mockReturnThis(),
      get: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };

    const mockClient = {
      pipeline: jest.fn().mockReturnValue(mockPipeline),
      exists: jest.fn(),
      get: jest.fn(),
      smembers: jest.fn(),
    };

    const mockRedisService = {
      getClient: jest.fn().mockReturnValue(mockClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisTokenService,
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    redisTokenService = module.get<RedisTokenService>(RedisTokenService);
  });

  describe('storeRefreshToken', () => {
    it('should store token hash and add to user set', async () => {
      await redisTokenService.storeRefreshToken('raw-token', 'user-1', 604800);

      expect(mockPipeline.setex).toHaveBeenCalledWith(
        'refresh_token:34d328009b123fbbb0dc93f18b3e6de1ecf7b1a5783c33dff7ffe1926f09e943',
        604800,
        'user-1',
      );
      expect(mockPipeline.sadd).toHaveBeenCalledWith(
        'user_tokens:user-1',
        '34d328009b123fbbb0dc93f18b3e6de1ecf7b1a5783c33dff7ffe1926f09e943',
      );
      expect(mockPipeline.expire).toHaveBeenCalledWith(
        'user_tokens:user-1',
        604800,
      );
      expect(mockPipeline.exec).toHaveBeenCalled();
    });
  });

  describe('isRefreshTokenValid', () => {
    it('should return true if token exists', async () => {
      const mockExists = jest.fn().mockResolvedValue(1);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const mockClient = (redisTokenService as any).redisService.getClient();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      mockClient.exists = mockExists;

      const result = await redisTokenService.isRefreshTokenValid('some-token');

      expect(result).toBe(true);
    });

    it('should return false if token does not exist', async () => {
      const mockExists = jest.fn().mockResolvedValue(0);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const mockClient = (redisTokenService as any).redisService.getClient();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      mockClient.exists = mockExists;

      const result =
        await redisTokenService.isRefreshTokenValid('invalid-token');

      expect(result).toBe(false);
    });
  });

  describe('revokeRefreshToken', () => {
    it('should delete token and remove from user set', async () => {
      const mockGet = jest.fn().mockResolvedValue('user-1');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const mockClient = (redisTokenService as any).redisService.getClient();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      mockClient.get = mockGet;

      await redisTokenService.revokeRefreshToken('token-to-revoke');

      expect(mockPipeline.del).toHaveBeenCalledWith(
        'refresh_token:568375ac34ce045a0faf856781250156874da1384ffd5b6d07a88f2b5460f43f',
      );
      expect(mockPipeline.srem).toHaveBeenCalledWith(
        'user_tokens:user-1',
        '568375ac34ce045a0faf856781250156874da1384ffd5b6d07a88f2b5460f43f',
      );
      expect(mockPipeline.exec).toHaveBeenCalled();
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should delete all tokens for user', async () => {
      const mockSmembers = jest.fn().mockResolvedValue(['hash1', 'hash2']);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const mockClient = (redisTokenService as any).redisService.getClient();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      mockClient.smembers = mockSmembers;

      await redisTokenService.revokeAllUserTokens('user-1');

      expect(mockPipeline.del).toHaveBeenCalledWith('refresh_token:hash1');
      expect(mockPipeline.del).toHaveBeenCalledWith('refresh_token:hash2');
      expect(mockPipeline.del).toHaveBeenCalledWith('user_tokens:user-1');
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it('should do nothing if user has no tokens', async () => {
      const mockSmembers = jest.fn().mockResolvedValue([]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const mockClient = (redisTokenService as any).redisService.getClient();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      mockClient.smembers = mockSmembers;

      await redisTokenService.revokeAllUserTokens('user-no-tokens');

      expect(mockPipeline.exec).not.toHaveBeenCalled();
    });
  });
});
