import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Vote } from './vote.entity';

@Entity('videos')
@Index(['youtubeId'])
@Index(['createdAt'])
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'youtube_id', length: 20 })
  youtubeId: string;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true, default: '' })
  description: string;

  @Column({ name: 'thumbnail_url', length: 500, nullable: true })
  thumbnailUrl: string;

  @Column({ length: 20, nullable: true })
  duration: string;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number;

  @Column({ name: 'upvote_count', type: 'int', default: 0 })
  upvoteCount: number;

  @Column({ name: 'downvote_count', type: 'int', default: 0 })
  downvoteCount: number;

  @ManyToOne(() => User, (user) => user.videos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shared_by_id' })
  sharedBy: User;

  @Column({ name: 'shared_by_id' })
  sharedById: string;

  @OneToMany(() => Vote, (vote) => vote.video)
  votes: Vote[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
