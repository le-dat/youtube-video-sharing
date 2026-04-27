import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { NewVideoNotification } from './types/notification.type';
import { WS_EVENTS } from './constants';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private authenticatedUsers = new Map<string, string>();
  private userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: Socket): void {
    void (async () => {
      try {
        const token = this.extractToken(client);
        if (token) {
          // eslint-disable-next-line @typescript-eslint/await-thenable
          const payload = await this.jwtService.verify<{ sub: string }>(token, {
            secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          });
          this.authenticatedUsers.set(client.id, payload.sub);
          this.addUserSocket(payload.sub, client.id);
          console.log(`Client connected: ${client.id} (User: ${payload.sub})`);
        } else {
          console.log(`Client connected: ${client.id} (Anonymous)`);
        }
      } catch {
        console.log(`Client connected: ${client.id} (Invalid token)`);
      }
    })();
  }

  handleDisconnect(client: Socket) {
    const userId = this.authenticatedUsers.get(client.id);
    if (userId) {
      this.removeUserSocket(userId, client.id);
      this.authenticatedUsers.delete(client.id);
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  private extractToken(client: Socket): string | null {
    // 1. Try to extract from cookies
    const cookieHeader = client.handshake.headers.cookie;
    if (cookieHeader) {
      const accessToken = cookieHeader
        .split(';')
        .find((c) => c.trim().startsWith('accessToken='))
        ?.split('=')[1];
      if (accessToken) return accessToken;
    }

    // 2. Fallback to handshake auth or authorization header
    const authToken = client.handshake.auth?.token as string | undefined;
    const bearerToken = client.handshake.headers?.authorization?.replace(
      'Bearer ',
      '',
    );
    return authToken || bearerToken || null;
  }

  private addUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  private removeUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  @SubscribeMessage(WS_EVENTS.AUTHENTICATE)
  handleAuthenticate(client: Socket, token: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      this.authenticatedUsers.set(client.id, payload.sub);
      this.addUserSocket(payload.sub, client.id);
      return { status: 'success', userId: payload.sub };
    } catch {
      return { status: 'error', message: 'Invalid token' };
    }
  }

  emitNewVideo(video: {
    id: string;
    title: string;
    thumbnailUrl: string;
    sharedBy: { username: string };
    createdAt: Date;
  }) {
    const notification: NewVideoNotification = {
      id: `notif-${Date.now()}-${crypto.randomUUID()}`,
      type: 'new_video',
      videoId: video.id,
      videoTitle: video.title,
      sharedByUsername: video.sharedBy?.username || 'Someone',
      thumbnailUrl: video.thumbnailUrl,
      createdAt: new Date().toISOString(),
    };
    this.server.emit(WS_EVENTS.NEW_VIDEO, notification);
  }

  emitVideoUpdate(video: {
    id: string;
    upvoteCount: number;
    downvoteCount: number;
  }) {
    this.server.emit(WS_EVENTS.VIDEO_UPDATE, {
      id: video.id,
      upvoteCount: video.upvoteCount,
      downvoteCount: video.downvoteCount,
    });
  }

  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }
}
