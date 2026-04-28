import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { VoteCountService } from './vote-count.service';
import { Video } from './entities/video.entity';
import { Vote, VoteType } from './entities/vote.entity';

describe('VoteCountService', () => {
  let service: VoteCountService;
  let mockVideoRepository: jest.Mocked<Repository<Video>>;
  let mockVoteRepository: jest.Mocked<Repository<Vote>>;
  let mockDataSource: {
    transaction: jest.Mock;
  };

  beforeEach(async () => {
    mockVideoRepository = {
      count: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<Repository<Video>>;

    mockVoteRepository = {
      count: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<Vote>>;

    mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoteCountService,
        { provide: getRepositoryToken(Video), useValue: mockVideoRepository },
        { provide: getRepositoryToken(Vote), useValue: mockVoteRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<VoteCountService>(VoteCountService);
  });

  describe('syncVoteCounts', () => {
    it('should recalculate vote counts from Vote table', async () => {
      mockVoteRepository.count
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(3);
      mockVideoRepository.update.mockResolvedValue({} as unknown as never);

      await service.syncVoteCounts('video-1');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockVoteRepository.count).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockVideoRepository.update).toHaveBeenCalled();
    });
  });

  describe('recordVote', () => {
    it('should atomically record vote and update counts in transaction', async () => {
      const mockManager = {
        delete: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockReturnValue({
          userId: 'user-1',
          videoId: 'video-1',
          type: VoteType.UP,
        }),
        save: jest.fn().mockResolvedValue({
          id: 'vote-1',
          userId: 'user-1',
          videoId: 'video-1',
          type: VoteType.UP,
        }),
        count: jest.fn().mockResolvedValueOnce(5).mockResolvedValueOnce(1),
        update: jest.fn().mockResolvedValue({}),
      };

      mockDataSource.transaction.mockImplementation(
        (cb: (manager: typeof mockManager) => Promise<void>) => cb(mockManager),
      );

      await service.recordVote('user-1', 'video-1', VoteType.UP);

      expect(mockManager.delete).toHaveBeenCalled();

      expect(mockManager.save).toHaveBeenCalled();

      expect(mockManager.update).toHaveBeenCalled();
    });

    it('should delete existing vote before inserting new one (vote change)', async () => {
      const mockManager = {
        delete: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockReturnValue({}),
        save: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockResolvedValue({}),
      };

      mockDataSource.transaction.mockImplementation(
        (cb: (manager: typeof mockManager) => Promise<void>) => cb(mockManager),
      );

      await service.recordVote('user-1', 'video-1', VoteType.DOWN);

      expect(mockManager.delete).toHaveBeenCalled();
    });
  });

  describe('removeVote', () => {
    it('should delete vote and recalculate counts in transaction', async () => {
      const mockManager = {
        delete: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValueOnce(4).mockResolvedValueOnce(1),
        update: jest.fn().mockResolvedValue({}),
      };

      mockDataSource.transaction.mockImplementation(
        (cb: (manager: typeof mockManager) => Promise<void>) => cb(mockManager),
      );

      await service.removeVote('user-1', 'video-1');

      expect(mockManager.delete).toHaveBeenCalled();

      expect(mockManager.update).toHaveBeenCalled();
    });
  });

  describe('getUserVote', () => {
    it('should return UP vote type when user has upvoted', async () => {
      mockVoteRepository.findOne.mockResolvedValue({
        type: VoteType.UP,
      } as Vote);

      const result = await service.getUserVote('video-1', 'user-1');

      expect(result).toBe(VoteType.UP);
    });

    it('should return DOWN vote type when user has downvoted', async () => {
      mockVoteRepository.findOne.mockResolvedValue({
        type: VoteType.DOWN,
      } as Vote);

      const result = await service.getUserVote('video-1', 'user-1');

      expect(result).toBe(VoteType.DOWN);
    });

    it('should return null when user has no vote', async () => {
      mockVoteRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserVote('video-1', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('getVoteCounts', () => {
    it('should return counts from video entity', async () => {
      mockVideoRepository.findOne.mockResolvedValue({
        upvoteCount: 20,
        downvoteCount: 5,
      } as Video);

      const result = await service.getVoteCounts('video-1');

      expect(result).toEqual({ upvoteCount: 20, downvoteCount: 5 });
    });

    it('should return zeros if video not found', async () => {
      mockVideoRepository.findOne.mockResolvedValue(null);

      const result = await service.getVoteCounts('non-existent');

      expect(result).toEqual({ upvoteCount: 0, downvoteCount: 0 });
    });
  });
});
