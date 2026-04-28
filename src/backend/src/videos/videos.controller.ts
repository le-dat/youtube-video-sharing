import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { VoteCountService } from './vote-count.service';
import { YoutubeService } from '../youtube/youtube.service';
import { EventsGateway } from '../websocket/events.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ShareVideoDto, VideoQueryDto } from './dto/video.dto';
import { VoteType } from './entities/vote.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('videos')
@Controller('videos')
export class VideosController {
  constructor(
    private readonly videosService: VideosService,
    private readonly voteCountService: VoteCountService,
    private readonly youtubeService: YoutubeService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all videos with pagination' })
  @ApiResponse({ status: 200, description: 'List of videos' })
  async list(@Query() query: VideoQueryDto) {
    return this.videosService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get video by ID' })
  @ApiResponse({ status: 200, description: 'Video details' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async show(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId?: string,
  ) {
    const video = await this.videosService.findById(id);
    if (!video) throw new NotFoundException('Video not found');

    const userVote = userId
      ? await this.voteCountService.getUserVote(id, userId)
      : null;

    return this.videosService.toResponseDto(video, userVote ?? undefined);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Share a YouTube video' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Video shared successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async share(
    @Body() dto: ShareVideoDto,
    @CurrentUser('id') userId: string,
  ) {
    const videoId = this.youtubeService.extractVideoId(dto.youtubeUrl);
    if (!videoId) {
      throw new BadRequestException('Invalid YouTube URL');
    }

    const existingVideo = await this.videosService.findByYoutubeId(videoId);
    if (existingVideo) {
      throw new BadRequestException('This video has already been shared');
    }

    const details = await this.youtubeService.getVideoDetails(videoId);
    const video = await this.videosService.create({
      youtubeId: videoId,
      title: details.title,
      description: details.description,
      thumbnailUrl: details.thumbnailUrl,
      duration: details.duration,
      viewCount: details.viewCount,
      sharedById: userId,
    });

    const response = this.videosService.toResponseDto(video, null);

    // Notify other clients
    this.eventsGateway.emitNewVideo({
      id: video.id,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl,
      sharedBy: { username: video.sharedBy?.username || 'Unknown' },
      createdAt: video.createdAt,
    });

    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/vote')
  @ApiOperation({ summary: 'Vote on a video' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Vote recorded' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async vote(
    @Param('id', ParseUUIDPipe) videoId: string,
    @Body('voteType') voteType: string,
    @CurrentUser('id') userId: string,
  ) {
    if (voteType !== VoteType.UP && voteType !== VoteType.DOWN) {
      throw new BadRequestException('voteType must be "up" or "down"');
    }

    const video = await this.videosService.findById(videoId);
    if (!video) throw new NotFoundException('Video not found');

    await this.voteCountService.recordVote(
      userId,
      videoId,
      voteType as VoteType,
    );

    const counts = await this.voteCountService.getVoteCounts(videoId);

    // Notify other clients about the vote update
    this.eventsGateway.emitVideoUpdate({
      id: videoId,
      upvoteCount: counts.upvoteCount,
      downvoteCount: counts.downvoteCount,
    });

    return {
      video: {
        upvote_count: counts.upvoteCount,
        downvote_count: counts.downvoteCount,
      },
    };
  }
}