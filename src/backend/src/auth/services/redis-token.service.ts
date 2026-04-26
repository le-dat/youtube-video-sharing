import { Injectable } from '@nestjs/common';
import { RedisService } from '../../config/redis.service';
import * as crypto from 'crypto';

@Injectable()
export class RedisTokenService {
  constructor(private readonly redisService: RedisService) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async storeRefreshToken(
    token: string,
    userId: string,
    expiresInSeconds: number,
  ): Promise<void> {
    const tokenHash = this.hashToken(token);
    await this.redisService
      .getClient()
      .setex(`refresh_token:${tokenHash}`, expiresInSeconds, userId);
  }

  async isRefreshTokenValid(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);
    const exists = await this.redisService
      .getClient()
      .exists(`refresh_token:${tokenHash}`);
    return exists === 1;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await this.redisService.getClient().del(`refresh_token:${tokenHash}`);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const tokenHashes = await this.redisService
      .getClient()
      .smembers(`user_tokens:${userId}`);

    if (tokenHashes.length === 0) return;

    const pipeline = this.redisService.getClient().pipeline();
    for (const hash of tokenHashes) {
      pipeline.del(`refresh_token:${hash}`);
    }
    pipeline.del(`user_tokens:${userId}`);
    await pipeline.exec();
  }
}