import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './entities/video.entity';
import { Vote } from './entities/vote.entity';
import { VoteCountService } from './vote-count.service';

@Module({
  imports: [TypeOrmModule.forFeature([Video, Vote])],
  providers: [VoteCountService],
  exports: [VoteCountService],
})
export class VideosModule {}
