import { Job } from 'bullmq';
import { VideosService } from '../videos.service';
import { YoutubeService } from '../../youtube/youtube.service';
import { EventsGateway } from '../../websocket/events.gateway';
import { VideoProcessor, VideoShareJobData } from './video-processor';

describe('VideoProcessor', () => {
  let processor: VideoProcessor;
  let mockVideosService: jest.Mocked<VideosService>;
  let mockYoutubeService: jest.Mocked<YoutubeService>;
  let mockEventsGateway: jest.Mocked<EventsGateway>;

  beforeEach(() => {
    mockVideosService = {
      create: jest.fn(),
    } as unknown as jest.Mocked<VideosService>;

    mockYoutubeService = {
      getVideoDetails: jest.fn(),
    } as unknown as jest.Mocked<YoutubeService>;

    mockEventsGateway = {
      emitNewVideo: jest.fn(),
      emitJobFailed: jest.fn(),
    } as unknown as jest.Mocked<EventsGateway>;

    processor = new VideoProcessor(
      mockVideosService,
      mockYoutubeService,
      mockEventsGateway,
    );
  });

  describe('process', () => {
    it('should create video and emit new video event', async () => {
      const mockJob = {
        id: 'job-123',
        data: {
          youtubeId: 'abc123',
          userId: 'user-1',
        },
      } as Job<VideoShareJobData>;

      const mockVideoDetails = {
        title: 'Test Video',
        description: 'Test description',
        thumbnailUrl: 'https://img.youtube.com/abc123.jpg',
        duration: 'PT5M30S',
        viewCount: 1000,
      };

      const mockCreatedVideo = {
        id: 'video-1',
        youtubeId: 'abc123',
        title: 'Test Video',
        description: 'Test description',
        thumbnailUrl: 'https://img.youtube.com/abc123.jpg',
        duration: 'PT5M30S',
        viewCount: 1000,
        upvoteCount: 0,
        downvoteCount: 0,
        sharedById: 'user-1',
        sharedBy: { id: 'user-1', username: 'testuser' },
        createdAt: new Date(),
      };

      mockYoutubeService.getVideoDetails.mockResolvedValue(mockVideoDetails);
      mockVideosService.create.mockResolvedValue(mockCreatedVideo as any);
      mockEventsGateway.emitNewVideo.mockReturnValue(undefined);

      const result = await processor.process(mockJob);

      expect(mockYoutubeService.getVideoDetails).toHaveBeenCalledWith('abc123');
      expect(mockVideosService.create).toHaveBeenCalledWith({
        youtubeId: 'abc123',
        title: 'Test Video',
        description: 'Test description',
        thumbnailUrl: 'https://img.youtube.com/abc123.jpg',
        duration: 'PT5M30S',
        viewCount: 1000,
        sharedById: 'user-1',
      });
      expect(mockEventsGateway.emitNewVideo).toHaveBeenCalledWith({
        id: 'video-1',
        title: 'Test Video',
        thumbnailUrl: 'https://img.youtube.com/abc123.jpg',
        sharedBy: { username: 'testuser' },
        createdAt: mockCreatedVideo.createdAt,
      });
      expect(result).toEqual({ videoId: 'video-1' });
    });

    it('should handle missing sharedBy user gracefully', async () => {
      const mockJob = {
        id: 'job-456',
        data: {
          youtubeId: 'xyz789',
          userId: 'user-2',
        },
      } as Job<VideoShareJobData>;

      const mockVideoDetails = {
        title: 'Another Video',
        description: 'Description',
        thumbnailUrl: 'https://img.youtube.com/xyz789.jpg',
        duration: 'PT10M',
        viewCount: 500,
      };

      const mockCreatedVideo = {
        id: 'video-2',
        youtubeId: 'xyz789',
        title: 'Another Video',
        sharedBy: undefined,
        createdAt: new Date(),
      };

      mockYoutubeService.getVideoDetails.mockResolvedValue(mockVideoDetails);
      mockVideosService.create.mockResolvedValue(mockCreatedVideo as any);
      mockEventsGateway.emitNewVideo.mockReturnValue(undefined);

      await processor.process(mockJob);

      expect(mockEventsGateway.emitNewVideo).toHaveBeenCalledWith(
        expect.objectContaining({
          sharedBy: { username: 'Unknown' },
        }),
      );
    });
  });

  describe('onFailed', () => {
    it('should emit job failure event with jobId and error message', () => {
      const mockJob = {
        id: 'job-789',
        data: {
          youtubeId: 'abc123',
          userId: 'user-1',
        },
      } as Job<VideoShareJobData>;

      const error = new Error('YouTube API failed');

      processor.onFailed(mockJob, error);

      expect(mockEventsGateway.emitJobFailed).toHaveBeenCalledWith(
        'job-789',
        'YouTube API failed',
      );
    });

    it('should not emit job failure event when jobId is undefined', () => {
      const mockJob = {
        id: undefined,
        data: {
          youtubeId: 'abc123',
          userId: 'user-1',
        },
      } as Job<VideoShareJobData>;

      const error = new Error('Some error');

      processor.onFailed(mockJob, error);

      expect(mockEventsGateway.emitJobFailed).not.toHaveBeenCalled();
    });
  });

  describe('onCompleted', () => {
    it('should log job completion', () => {
      const mockJob = {
        id: 'job-999',
        data: {
          youtubeId: 'abc123',
          userId: 'user-1',
        },
      } as Job<VideoShareJobData>;

      const loggerSpy = jest.spyOn(processor['logger'], 'log');

      processor.onCompleted(mockJob);

      expect(loggerSpy).toHaveBeenCalledWith('Job job-999 completed successfully');
    });
  });
});