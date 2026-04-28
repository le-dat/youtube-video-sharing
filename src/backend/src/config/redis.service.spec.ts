import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockReturnValueOnce('localhost')
              .mockReturnValueOnce(6379)
              .mockReturnValueOnce(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a redis client', () => {
    const client = service.getClient();
    expect(client).toBeDefined();
  });

  describe('onModuleDestroy', () => {
    it('should quit the redis client', async () => {
      const quitSpy = jest.spyOn(service.getClient(), 'quit');
      await service.onModuleDestroy();
      expect(quitSpy).toHaveBeenCalled();
    });
  });
});
