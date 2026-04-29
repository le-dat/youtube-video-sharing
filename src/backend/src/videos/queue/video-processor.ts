import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { VideosService } from '../videos.service';
import { YoutubeService } from '../../youtube/youtube.service';
import { EventsGateway } from '../../websocket/events.gateway';

export interface VideoShareJobData {
  youtubeId: string;
  userId: string;
}

@Processor('video-sharing')
@Injectable()
export class VideoProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoProcessor.name);

  constructor(
    private readonly videosService: VideosService,
    private readonly youtubeService: YoutubeService,
    private readonly eventsGateway: EventsGateway,
  ) {
    super();
  }

  async process(job: Job<VideoShareJobData>) {
    this.logger.log(`Processing video share job ${job.id}`);
    const { youtubeId, userId } = job.data;

    const details = await this.youtubeService.getVideoDetails(youtubeId);
    const video = await this.videosService.create({
      youtubeId,
      title: details.title,
      description: details.description,
      thumbnailUrl: details.thumbnailUrl,
      duration: details.duration,
      viewCount: details.viewCount,
      sharedById: userId,
    });

    this.eventsGateway.emitNewVideo({
      id: video.id,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl,
      sharedBy: { username: video.sharedBy?.username || 'Unknown' },
      createdAt: video.createdAt,
    });

    return { videoId: video.id };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<VideoShareJobData>) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<VideoShareJobData>, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
    if (job.id) {
      this.eventsGateway.emitJobFailed(job.id, error.message);
    }
  }
}
