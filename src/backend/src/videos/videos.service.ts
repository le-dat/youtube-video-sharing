import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from './entities/video.entity';
import { VideoQueryDto } from './dto/video.dto';

interface VideoCreateData {
  youtubeId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: number;
  sharedById: string;
}

export interface VideoResponse {
  id: string;
  youtube_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  duration: string;
  view_count: number;
  upvote_count: number;
  downvote_count: number;
  shared_by: { id: string; username: string };
  user_vote: 'up' | 'down' | null;
  created_at: string;
}

@Injectable()
export class VideosService {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  ) {}

  async findAll(query: VideoQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [videos, total] = await this.videoRepository.findAndCount({
      relations: ['sharedBy'],
      order: { [query.sort ?? 'createdAt']: query.order ?? 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: videos.map((v) => this.toResponseDto(v, null)),
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: total,
        items_per_page: limit,
      },
    };
  }

  async findById(id: string): Promise<Video | null> {
    return this.videoRepository.findOne({
      where: { id },
      relations: ['sharedBy'],
    });
  }

  async findByYoutubeId(youtubeId: string): Promise<Video | null> {
    return this.videoRepository.findOne({ where: { youtubeId } });
  }

  async create(data: VideoCreateData): Promise<Video> {
    const video = this.videoRepository.create({
      youtubeId: data.youtubeId,
      title: data.title,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl,
      duration: data.duration,
      viewCount: data.viewCount,
      sharedById: data.sharedById,
      upvoteCount: 0,
      downvoteCount: 0,
    });
    const savedVideo = await this.videoRepository.save(video);
    return this.findById(savedVideo.id) as Promise<Video>;
  }

  toResponseDto(
    video: Video,
    userVote: 'up' | 'down' | null | undefined,
  ): VideoResponse {
    return {
      id: video.id,
      youtube_id: video.youtubeId,
      title: video.title,
      description: video.description,
      thumbnail_url: video.thumbnailUrl ?? '',
      duration: video.duration ?? '',
      view_count: video.viewCount,
      upvote_count: video.upvoteCount,
      downvote_count: video.downvoteCount,
      shared_by: {
        id: video.sharedBy?.id ?? video.sharedById,
        username: video.sharedBy?.username ?? 'Unknown',
      },
      user_vote: userVote ?? null,
      created_at: video.createdAt.toISOString(),
    };
  }
}
