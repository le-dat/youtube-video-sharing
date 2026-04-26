import { Controller, Get, UseGuards, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser() userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return this.usersService.toResponseDto(user);
  }
}