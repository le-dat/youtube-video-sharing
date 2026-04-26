import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Video } from './entities/video.entity';
import { Vote, VoteType } from './entities/vote.entity';

@Injectable()
export class VoteCountService {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    @InjectRepository(Vote)
    private readonly voteRepository: Repository<Vote>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Recalculate vote counts for a video from actual Vote records.
   * Use this after vote changes to resync denormalized counts.
   */
  async syncVoteCounts(videoId: string): Promise<void> {
    const [upvoteCount, downvoteCount] = await Promise.all([
      this.voteRepository.count({ where: { videoId, type: VoteType.UP } }),
      this.voteRepository.count({ where: { videoId, type: VoteType.DOWN } }),
    ]);

    await this.videoRepository.update(videoId, { upvoteCount, downvoteCount });
  }

  /**
   * Atomically record a vote and sync counts in a transaction.
   */
  async recordVote(userId: string, videoId: string, type: VoteType): Promise<Vote> {
    return this.dataSource.transaction(async (manager) => {
      // Remove any existing vote
      await manager.delete(Vote, { userId, videoId });

      // Create new vote
      const vote = manager.create(Vote, { userId, videoId, type });
      await manager.save(vote);

      // Recalculate counts
      const [upvoteCount, downvoteCount] = await Promise.all([
        manager.count(Vote, { where: { videoId, type: VoteType.UP } }),
        manager.count(Vote, { where: { videoId, type: VoteType.DOWN } }),
      ]);

      await manager.update(Video, videoId, { upvoteCount, downvoteCount });

      return vote;
    });
  }

  /**
   * Remove a vote and sync counts in a transaction.
   */
  async removeVote(userId: string, videoId: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      await manager.delete(Vote, { userId, videoId });

      const [upvoteCount, downvoteCount] = await Promise.all([
        manager.count(Vote, { where: { videoId, type: VoteType.UP } }),
        manager.count(Vote, { where: { videoId, type: VoteType.DOWN } }),
      ]);

      await manager.update(Video, videoId, { upvoteCount, downvoteCount });
    });
  }
}