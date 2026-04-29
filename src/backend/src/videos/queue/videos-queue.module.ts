import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { VideoProcessor } from './video-processor';
import { VideosModule } from '../videos.module';
import { YoutubeModule } from '../../youtube/youtube.module';
import { WebsocketModule } from '../../websocket/websocket.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'video-sharing',
    }),
    VideosModule,
    YoutubeModule,
    WebsocketModule,
  ],
  providers: [VideoProcessor],
  exports: [BullModule],
})
export class VideosQueueModule {}
