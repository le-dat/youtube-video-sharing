import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { YoutubeService } from './youtube.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('YoutubeService', () => {
  let service: YoutubeService;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YoutubeService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<YoutubeService>(YoutubeService);
  });

  describe('extractVideoId', () => {
    it('should extract video ID from youtube.com/watch URL', () => {
      const result = service.extractVideoId(
        'https://www.youtube.com/watch?v=abc123XYZ',
      );
      expect(result).toBe('abc123XYZ');
    });

    it('should extract video ID from youtu.be short URL', () => {
      const result = service.extractVideoId('https://youtu.be/xyz789Abc');
      expect(result).toBe('xyz789Abc');
    });

    it('should extract video ID from youtube.com/embed URL', () => {
      const result = service.extractVideoId(
        'https://www.youtube.com/embed/dEf456Ghi',
      );
      expect(result).toBe('dEf456Ghi');
    });

    it('should extract video ID from URL with additional parameters', () => {
      const result = service.extractVideoId(
        'https://www.youtube.com/watch?v=abc123&list=playlist&t=60',
      );
      expect(result).toBe('abc123');
    });

    it('should return null for invalid URL', () => {
      const result = service.extractVideoId('https://example.com/video');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = service.extractVideoId('');
      expect(result).toBeNull();
    });
  });

  describe('getVideoDetails', () => {
    const mockVideoId = 'dQw4w9WgXcQ';
    const mockApiResponse = {
      data: {
        items: [
          {
            snippet: {
              title: 'Rick Astley - Never Gonna Give You Up',
              description: 'Official music video for Never Gonna Give You Up',
              thumbnails: {
                high: {
                  url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
                },
                medium: {
                  url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                },
              },
            },
            statistics: {
              viewCount: '1000000000',
              likeCount: '5000000',
            },
            contentDetails: {
              duration: 'PT3M33S',
            },
          },
        ],
      },
    };

    it('should throw error if YOUTUBE_API_KEY is not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await expect(service.getVideoDetails(mockVideoId)).rejects.toThrow(
        'YOUTUBE_API_KEY is not configured',
      );
    });

    it('should return video details on successful API call', async () => {
      mockConfigService.get.mockReturnValue('test-api-key');
      mockedAxios.get.mockResolvedValue(mockApiResponse);

      const result = await service.getVideoDetails(mockVideoId);

      expect(result.youtubeId).toBe(mockVideoId);
      expect(result.title).toBe('Rick Astley - Never Gonna Give You Up');
      expect(result.description).toBe(
        'Official music video for Never Gonna Give You Up',
      );
      expect(result.thumbnailUrl).toBe(
        'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      );
      expect(result.duration).toBe('PT3M33S');
      expect(result.viewCount).toBe(1000000000);
      expect(result.likeCount).toBe(5000000);
    });

    it('should throw NotFoundException when video not found', async () => {
      mockConfigService.get.mockReturnValue('test-api-key');
      mockedAxios.get.mockResolvedValue({ data: { items: [] } });

      await expect(service.getVideoDetails('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use medium thumbnail when high is not available', async () => {
      mockConfigService.get.mockReturnValue('test-api-key');
      mockedAxios.get.mockResolvedValue({
        data: {
          items: [
            {
              snippet: {
                title: 'Test',
                description: '',
                thumbnails: {
                  medium: { url: 'https://i.ytimg.com/vi/test/mqdefault.jpg' },
                },
              },
              statistics: { viewCount: '0', likeCount: '0' },
              contentDetails: { duration: 'PT1M' },
            },
          ],
        },
      });

      const result = await service.getVideoDetails('test');

      expect(result.thumbnailUrl).toBe(
        'https://i.ytimg.com/vi/test/mqdefault.jpg',
      );
    });

    it('should use default thumbnail when high and medium are not available', async () => {
      mockConfigService.get.mockReturnValue('test-api-key');
      mockedAxios.get.mockResolvedValue({
        data: {
          items: [
            {
              snippet: {
                title: 'Test',
                description: '',
                thumbnails: {
                  default: { url: 'https://i.ytimg.com/vi/test/default.jpg' },
                },
              },
              statistics: { viewCount: '0', likeCount: '0' },
              contentDetails: { duration: 'PT1M' },
            },
          ],
        },
      });

      const result = await service.getVideoDetails('test');

      expect(result.thumbnailUrl).toBe(
        'https://i.ytimg.com/vi/test/default.jpg',
      );
    });

    it('should handle empty description', async () => {
      mockConfigService.get.mockReturnValue('test-api-key');
      mockedAxios.get.mockResolvedValue({
        data: {
          items: [
            {
              snippet: {
                title: 'Test',
                description: '',
                thumbnails: { default: { url: '' } },
              },
              statistics: {},
              contentDetails: { duration: 'PT1M' },
            },
          ],
        },
      });

      const result = await service.getVideoDetails('test');

      expect(result.description).toBe('');
    });

    it('should handle missing statistics', async () => {
      mockConfigService.get.mockReturnValue('test-api-key');
      mockedAxios.get.mockResolvedValue({
        data: {
          items: [
            {
              snippet: {
                title: 'Test',
                description: '',
                thumbnails: { default: { url: '' } },
              },
              statistics: {},
              contentDetails: { duration: 'PT1M' },
            },
          ],
        },
      });

      const result = await service.getVideoDetails('test');

      expect(result.viewCount).toBe(0);
      expect(result.likeCount).toBe(0);
    });

    it('should throw NotFoundException on API failure', async () => {
      mockConfigService.get.mockReturnValue('test-api-key');
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(service.getVideoDetails(mockVideoId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
