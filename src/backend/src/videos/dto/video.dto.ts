import { IsString, IsEnum, MaxLength, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { VoteType } from '../entities/vote.entity';

export class ShareVideoDto {
  @IsString()
  @MaxLength(200)
  youtubeUrl: string;
}

export class VoteDto {
  @IsEnum(VoteType)
  type: VoteType;
}

export class VideoQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['createdAt', 'upvoteCount', 'downvoteCount'] as const)
  sort?: 'createdAt' | 'upvoteCount' | 'downvoteCount' = 'createdAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'] as const)
  order?: 'ASC' | 'DESC' = 'DESC';
}