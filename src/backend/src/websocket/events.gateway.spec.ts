/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { EventsGateway } from './events.gateway';

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let mockJwtService: jest.Mocked<JwtService>;

  let mockConfigService: jest.Mocked<ConfigService>;
  let mockServer: { emit: jest.Mock };

  beforeEach(async () => {
    mockJwtService = {
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as jest.Mocked<ConfigService>;

    mockServer = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);

    gateway.server = mockServer as unknown as Server;
  });

  describe('handleConnection', () => {
    it('should authenticate user with valid token in auth.token', async () => {
      const mockClient = {
        id: 'socket-1',
        handshake: {
          auth: { token: 'valid-token' },
          headers: {},
        },
      } as unknown as Socket;

      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });

      gateway.handleConnection(mockClient);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockJwtService.verify).toHaveBeenCalled();
    });

    it('should authenticate user with valid token in cookie', async () => {
      const mockClient = {
        id: 'socket-2',
        handshake: {
          auth: {},
          headers: { cookie: 'accessToken=cookie-token; other=value' },
        },
      } as unknown as Socket;

      mockJwtService.verify.mockReturnValue({ sub: 'user-2' });

      gateway.handleConnection(mockClient);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockJwtService.verify).toHaveBeenCalled();
    });

    it('should allow anonymous connection without token', async () => {
      const mockClient = {
        id: 'socket-3',
        handshake: {
          auth: {},
          headers: {},
        },
      } as unknown as Socket;

      gateway.handleConnection(mockClient);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockJwtService.verify).not.toHaveBeenCalled();
    });
  });

  describe('handleAuthenticate', () => {
    it('should authenticate and return success with valid token', () => {
      const mockClient = { id: 'socket-auth' } as unknown as Socket;

      mockJwtService.verify.mockReturnValue({ sub: 'user-auth' });

      const result = gateway.handleAuthenticate(mockClient, 'valid-token');

      expect(result).toEqual({ status: 'success', userId: 'user-auth' });
    });

    it('should return error with invalid token', () => {
      const mockClient = { id: 'socket-auth-2' } as unknown as Socket;

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = gateway.handleAuthenticate(mockClient, 'bad-token');

      expect(result).toEqual({ status: 'error', message: 'Invalid token' });
    });
  });

  describe('emitNewVideo', () => {
    it('should emit NEW_VIDEO event to all connected clients', () => {
      const videoData = {
        id: 'video-1',
        title: 'Test Video',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        sharedBy: { username: 'testuser' },
        createdAt: new Date(),
      };

      gateway.emitNewVideo(videoData);

      expect(mockServer.emit).toHaveBeenCalled();
    });

    it('should use "Someone" when sharedBy username is missing', () => {
      const videoData = {
        id: 'video-2',
        title: 'Another Video',
        thumbnailUrl: 'https://example.com/thumb2.jpg',
        sharedBy: { username: '' },
        createdAt: new Date(),
      };

      gateway.emitNewVideo(videoData);

      expect(mockServer.emit).toHaveBeenCalled();
    });
  });

  describe('emitVideoUpdate', () => {
    it('should emit VIDEO_UPDATE event with vote counts', () => {
      const updateData = {
        id: 'video-1',
        upvoteCount: 10,
        downvoteCount: 2,
      };

      gateway.emitVideoUpdate(updateData);

      expect(mockServer.emit).toHaveBeenCalled();
    });
  });

  describe('getConnectedUsersCount', () => {
    it('should return the number of connected users', async () => {
      expect(gateway.getConnectedUsersCount()).toBe(0);

      const mockClient = {
        id: 'socket-count',
        handshake: {
          auth: { token: 'token' },
          headers: {},
        },
      } as unknown as Socket;

      mockJwtService.verify.mockReturnValue({ sub: 'user-count' });
      gateway.handleConnection(mockClient);
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(gateway.getConnectedUsersCount()).toBeGreaterThanOrEqual(0);
    });
  });
});
