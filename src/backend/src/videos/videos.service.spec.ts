import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VideosService, VideoCreateData } from './videos.service';
import { Video } from './entities/video.entity';

describe('VideosService', () => {
  let service: VideosService;
  let mockRepository: {
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

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
    createdAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    mockRepository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        {
          provide: getRepositoryToken(Video),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
  });

  describe('findAll', () => {
    it('should return paginated videos with default pagination', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockVideo], 1]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.pagination.current_page).toBe(1);
      expect(result.pagination.total_items).toBe(1);
      expect(result.pagination.items_per_page).toBe(20);
    });

    it('should use custom page and limit', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockVideo], 50]);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(result.pagination.current_page).toBe(2);
      expect(result.pagination.items_per_page).toBe(10);
      expect(result.pagination.total_pages).toBe(5);
    });
  });

  describe('findById', () => {
    it('should return video with sharedBy relation', async () => {
      mockRepository.findOne.mockResolvedValue(mockVideo);

      const result = await service.findById('video-1');

      expect(result).toEqual(mockVideo);
    });

    it('should return null if video not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByYoutubeId', () => {
    it('should return video by youtube ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockVideo);

      const result = await service.findByYoutubeId('abc123');

      expect(result).toEqual(mockVideo);
    });
  });

  describe('create', () => {
    it('should create video and return with sharedBy relation', async () => {
      const createData: VideoCreateData = {
        youtubeId: 'new123',
        title: 'New Video',
        description: 'Description',
        thumbnailUrl: 'https://img.youtube.com/new123.jpg',
        duration: 'PT3M',
        viewCount: 500,
        sharedById: 'user-1',
      };

      const savedVideo: Video = {
        id: 'video-new',
        ...createData,
        upvoteCount: 0,
        downvoteCount: 0,
      } as Video;

      mockRepository.create.mockReturnValue(savedVideo);
      mockRepository.save.mockResolvedValue(savedVideo);
      mockRepository.findOne.mockResolvedValue({
        ...mockVideo,
        id: 'video-new',
      });

      const result = await service.create(createData);

      expect(result).toBeDefined();
    });
  });

  describe('toResponseDto', () => {
    it('should convert video to response DTO with user vote', () => {
      const dto = service.toResponseDto(mockVideo, 'up');

      expect(dto.id).toBe('video-1');
      expect(dto.youtube_id).toBe('abc123');
      expect(dto.title).toBe('Test Video');
      expect(dto.upvote_count).toBe(10);
      expect(dto.downvote_count).toBe(2);
      expect(dto.user_vote).toBe('up');
      expect(dto.shared_by.username).toBe('testuser');
    });

    it('should return null user_vote when no vote', () => {
      const dto = service.toResponseDto(mockVideo, null);

      expect(dto.user_vote).toBeNull();
    });

    it('should handle missing sharedBy relation gracefully', () => {
      const videoWithoutUser = {
        ...mockVideo,
        sharedBy: undefined,
        sharedById: 'user-1',
      };
      const dto = service.toResponseDto(videoWithoutUser as Video, null);

      expect(dto.shared_by.username).toBe('Unknown');
      expect(dto.shared_by.id).toBe('user-1');
    });

    it('should handle null thumbnail and duration', () => {
      const videoWithNulls = {
        ...mockVideo,
        thumbnailUrl: null as unknown as string,
        duration: null as unknown as string,
      };
      const dto = service.toResponseDto(videoWithNulls, null);

      expect(dto.thumbnail_url).toBe('');
      expect(dto.duration).toBe('');
    });

    it('should format createdAt as ISO string', () => {
      const dto = service.toResponseDto(mockVideo, null);

      expect(dto.created_at).toBe('2024-01-01T00:00:00.000Z');
    });
  });
});
