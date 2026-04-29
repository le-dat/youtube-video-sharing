import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Video } from './entities/video.entity';
import { Vote } from './entities/vote.entity';
import { VoteCountService } from './vote-count.service';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video, Vote]),
    BullModule.registerQueue({ name: 'video-sharing' }),
  ],
  controllers: [VideosController],
  providers: [VideosService, VoteCountService],
  exports: [VoteCountService, VideosService],
})
export class VideosModule {}
