import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Video } from '../../videos/entities/video.entity';
import { Vote } from '../../videos/entities/vote.entity';

@Entity('users')
@Index(['email'])
@Index(['username'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 30 })
  username: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  @Exclude()
  password: string;

  @OneToMany(() => Video, (video) => video.sharedBy)
  videos: Video[];

  @OneToMany(() => Vote, (vote) => vote.user)
  votes: Vote[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}