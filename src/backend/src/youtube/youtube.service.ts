import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface YouTubeVideoDetails {
  youtubeId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: number;
  likeCount: number;
}

@Injectable()
export class YoutubeService {
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(private readonly configService: ConfigService) {}

  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
      /(?:youtu\.be\/)([^&\n?#]+)/,
      /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  async getVideoDetails(videoId: string): Promise<YouTubeVideoDetails> {
    const apiKey = this.configService.get('YOUTUBE_API_KEY');

    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY is not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          part: 'snippet,statistics,contentDetails',
          id: videoId,
          key: apiKey,
        },
        timeout: 5000,
      });

      if (!response.data.items?.length) {
        throw new NotFoundException('YouTube video not found');
      }

      const { snippet, statistics, contentDetails } = response.data.items[0];
      return {
        youtubeId: videoId,
        title: snippet.title,
        description: snippet.description || '',
        thumbnailUrl:
          snippet.thumbnails.high?.url ||
          snippet.thumbnails.medium?.url ||
          snippet.thumbnails.default?.url,
        duration: contentDetails.duration,
        viewCount: parseInt(statistics.viewCount || '0', 10),
        likeCount: parseInt(statistics.likeCount || '0', 10),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException('Failed to fetch YouTube video details');
    }
  }
}