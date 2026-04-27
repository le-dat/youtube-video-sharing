import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Video } from './video.entity';

export enum VoteType {
  UP = 'up',
  DOWN = 'down',
}

@Entity('votes')
@Unique(['userId', 'videoId'])
@Index(['userId'])
@Index(['videoId'])
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: VoteType,
  })
  type: VoteType;

  @ManyToOne(() => User, (user) => user.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Video, (video) => video.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video: Video;

  @Column({ name: 'video_id' })
  videoId: string;
}
