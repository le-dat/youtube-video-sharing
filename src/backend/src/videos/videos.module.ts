import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './entities/video.entity';
import { Vote } from './entities/vote.entity';
import { VoteCountService } from './vote-count.service';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Video, Vote])],
  controllers: [VideosController],
  providers: [VideosService, VoteCountService],
  exports: [VoteCountService, VideosService],
})
export class VideosModule {}