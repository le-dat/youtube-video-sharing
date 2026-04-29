/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { VoteCountService } from './vote-count.service';
import { YoutubeService } from '../youtube/youtube.service';
import { EventsGateway } from '../websocket/events.gateway';
import { Video } from './entities/video.entity';
import { VoteType } from './entities/vote.entity';

describe('VideosController', () => {
  let controller: VideosController;
  let mockVideosService: jest.Mocked<VideosService>;
  let mockVoteCountService: jest.Mocked<VoteCountService>;
  let mockYoutubeService: jest.Mocked<YoutubeService>;
  let mockEventsGateway: jest.Mocked<EventsGateway>;
  let mockVideoQueue: jest.Mocked<Queue>;

  const mockVideo: Video = {
    id: 'video-1',
    youtubeId: 'abc123',
    title: 'Test Video',
    description: 'Test description',
    thumbnailUrl: 'https://img.youtube.com/abc123.jpg',
    duration: 'PT5M30S',
    viewCount: 1000,
    upvoteCount: 10,
    downvoteCount: 2,
    sharedById: 'user-1',
    sharedBy: {
      id: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashed',
      createdAt: new Date(),
    },
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockVideosService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByYoutubeId: jest.fn(),
      create: jest.fn(),
      toResponseDto: jest.fn(),
    } as unknown as jest.Mocked<VideosService>;

    mockVoteCountService = {
      getUserVote: jest.fn(),
      getVoteCounts: jest.fn(),
      recordVote: jest.fn(),
    } as unknown as jest.Mocked<VoteCountService>;

    mockYoutubeService = {
      extractVideoId: jest.fn(),
      getVideoDetails: jest.fn(),
    } as unknown as jest.Mocked<YoutubeService>;

    mockEventsGateway = {
      emitNewVideo: jest.fn(),
      emitVideoUpdate: jest.fn(),
    } as unknown as jest.Mocked<EventsGateway>;

    mockVideoQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    } as unknown as jest.Mocked<Queue>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideosController],
      providers: [
        { provide: VideosService, useValue: mockVideosService },
        { provide: VoteCountService, useValue: mockVoteCountService },
        { provide: YoutubeService, useValue: mockYoutubeService },
        { provide: EventsGateway, useValue: mockEventsGateway },
        { provide: 'BullQueue_video-sharing', useValue: mockVideoQueue },
      ],
    }).compile();

    controller = module.get<VideosController>(VideosController);
  });

  describe('list', () => {
    it('should return paginated videos', async () => {
      const paginatedResult = {
        data: [mockVideo],
        pagination: {
          current_page: 1,
          items_per_page: 20,
          total_items: 1,
          total_pages: 1,
        },
      };
      mockVideosService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.list({});

      expect(mockVideosService.findAll).toHaveBeenCalled();
      expect(result).toEqual(paginatedResult);
    });

    it('should pass query parameters to service', async () => {
      const paginatedResult = {
        data: [],
        pagination: {
          current_page: 2,
          items_per_page: 10,
          total_items: 0,
          total_pages: 0,
        },
      };
      mockVideosService.findAll.mockResolvedValue(paginatedResult);

      await controller.list({ page: 2, limit: 10 });

      expect(mockVideosService.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
      });
    });
  });

  describe('show', () => {
    it('should return video with user vote when authenticated', async () => {
      mockVideosService.findById.mockResolvedValue(mockVideo);
      mockVideosService.toResponseDto.mockReturnValue({
        id: 'video-1',
        youtube_id: 'abc123',
        title: 'Test Video',
        description: 'Test description',
        thumbnail_url: 'https://img.youtube.com/abc123.jpg',
        duration: 'PT5M30S',
        view_count: 1000,
        upvote_count: 10,
        downvote_count: 2,
        user_vote: 'up',
        shared_by: { id: 'user-1', username: 'testuser' },
        created_at: mockVideo.createdAt.toISOString(),
      });
      mockVoteCountService.getUserVote.mockResolvedValue(VoteType.UP);

      const result = await controller.show('video-1', 'user-1');

      expect(mockVideosService.findById).toHaveBeenCalledWith('video-1');
      expect(mockVoteCountService.getUserVote).toHaveBeenCalledWith(
        'video-1',
        'user-1',
      );
      expect(result.user_vote).toBe('up');
    });

    it('should return video without vote when not authenticated', async () => {
      mockVideosService.findById.mockResolvedValue(mockVideo);
      mockVideosService.toResponseDto.mockReturnValue({
        id: 'video-1',
        youtube_id: 'abc123',
        title: 'Test Video',
        description: 'Test description',
        thumbnail_url: 'https://img.youtube.com/abc123.jpg',
        duration: 'PT5M30S',
        view_count: 1000,
        upvote_count: 10,
        downvote_count: 2,
        user_vote: null,
        shared_by: { id: 'user-1', username: 'testuser' },
        created_at: mockVideo.createdAt.toISOString(),
      });

      const result = await controller.show('video-1', undefined);

      expect(mockVoteCountService.getUserVote).not.toHaveBeenCalled();
      expect(result.user_vote).toBeNull();
    });

    it('should throw NotFoundException when video not found', async () => {
      mockVideosService.findById.mockResolvedValue(null);

      await expect(controller.show('non-existent', undefined)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('share', () => {
    it('should enqueue video share job and return accepted', async () => {
      const dto = { youtubeUrl: 'https://www.youtube.com/watch?v=abc123' };
      mockYoutubeService.extractVideoId.mockReturnValue('abc123');
      mockVideosService.findByYoutubeId.mockResolvedValue(null);

      const result = await controller.share(dto, 'user-1');

      expect(mockYoutubeService.extractVideoId).toHaveBeenCalledWith(
        dto.youtubeUrl,
      );
      expect(mockVideoQueue.add).toHaveBeenCalledWith(
        'share',
        { youtubeId: 'abc123', userId: 'user-1' },
        expect.objectContaining({ attempts: 3 }),
      );
      expect(result.status).toBe('accepted');
      expect(result.jobId).toBe('job-123');
    });

    it('should throw BadRequestException for invalid YouTube URL', async () => {
      const dto = { youtubeUrl: 'https://example.com/video' };
      mockYoutubeService.extractVideoId.mockReturnValue(null);

      await expect(controller.share(dto, 'user-1')).rejects.toThrow(
        'Invalid YouTube URL',
      );
    });

    it('should throw BadRequestException when video already shared', async () => {
      const dto = { youtubeUrl: 'https://www.youtube.com/watch?v=abc123' };
      mockYoutubeService.extractVideoId.mockReturnValue('abc123');
      mockVideosService.findByYoutubeId.mockResolvedValue(mockVideo);

      await expect(controller.share(dto, 'user-1')).rejects.toThrow(
        'This video has already been shared',
      );
    });
  });

  describe('vote', () => {
    it('should record vote and emit update event', async () => {
      mockVideosService.findById.mockResolvedValue(mockVideo);
      mockVoteCountService.recordVote.mockResolvedValue(undefined);
      mockVoteCountService.getVoteCounts.mockResolvedValue({
        upvoteCount: 11,
        downvoteCount: 2,
      });
      mockEventsGateway.emitVideoUpdate.mockReturnValue(undefined);

      const result = await controller.vote('video-1', 'up', 'user-1');

      expect(mockVoteCountService.recordVote).toHaveBeenCalledWith(
        'user-1',
        'video-1',
        'up',
      );
      expect(mockEventsGateway.emitVideoUpdate).toHaveBeenCalledWith({
        id: 'video-1',
        upvoteCount: 11,
        downvoteCount: 2,
      });
      expect(result.video.upvote_count).toBe(11);
    });

    it('should throw BadRequestException for invalid vote type', async () => {
      mockVideosService.findById.mockResolvedValue(mockVideo);

      await expect(
        controller.vote('video-1', 'invalid', 'user-1'),
      ).rejects.toThrow('voteType must be "up" or "down"');
    });

    it('should throw NotFoundException when video not found', async () => {
      mockVideosService.findById.mockResolvedValue(null);

      await expect(controller.vote('video-1', 'up', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
