import {
  IsString,
  IsEnum,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VoteType } from '../entities/vote.entity';
import { ApiProperty } from '@nestjs/swagger';

export class ShareVideoDto {
  @ApiProperty({
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'YouTube video URL',
  })
  @IsString()
  @MaxLength(200)
  youtubeUrl: string;
}

export class VoteDto {
  @ApiProperty({
    enum: VoteType,
    example: VoteType.UP,
    description: 'Vote type',
  })
  @IsEnum(VoteType)
  type: VoteType;
}

export class VideoQueryDto {
  @ApiProperty({ required: false, example: 1, description: 'Page number' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    required: false,
    example: 20,
    description: 'Items per page (max 100)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiProperty({
    required: false,
    enum: ['createdAt', 'upvoteCount', 'downvoteCount'],
    description: 'Sort field',
  })
  @IsOptional()
  @IsEnum(['createdAt', 'upvoteCount', 'downvoteCount'] as const)
  sort?: 'createdAt' | 'upvoteCount' | 'downvoteCount' = 'createdAt';

  @ApiProperty({
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'] as const)
  order?: 'ASC' | 'DESC' = 'DESC';
}
