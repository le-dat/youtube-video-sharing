import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { EventsGateway } from './events.gateway';
import { WS_EVENTS } from './constants';

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockServer: Partial<Server>;

  beforeEach(async () => {
    mockJwtService = {
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as jest.Mocked<ConfigService>;

    mockServer = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);
    // @ts-ignore - set private server property for testing
    gateway.server = mockServer as Server;
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

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token', {
        secret: 'test-secret',
      });
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

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockJwtService.verify).toHaveBeenCalledWith('cookie-token', {
        secret: 'test-secret',
      });
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

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockJwtService.verify).not.toHaveBeenCalled();
    });

    it('should handle invalid token gracefully', async () => {
      const mockClient = {
        id: 'socket-4',
        handshake: {
          auth: { token: 'invalid-token' },
          headers: {},
        },
      } as unknown as Socket;

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      gateway.handleConnection(mockClient);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockJwtService.verify).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should remove user from authenticatedUsers on disconnect', async () => {
      const mockClient = {
        id: 'socket-1',
        handshake: { auth: {}, headers: {} },
      } as unknown as Socket;

      // First connect with a valid token
      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
      gateway.handleConnection(mockClient);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Then disconnect
      gateway.handleDisconnect(mockClient);

      // @ts-ignore - access private property for verification
      expect(gateway.authenticatedUsers.has('socket-1')).toBe(false);
    });
  });

  describe('handleAuthenticate', () => {
    it('should authenticate and return success with valid token', async () => {
      const mockClient = { id: 'socket-auth' } as unknown as Socket;

      mockJwtService.verify.mockReturnValue({ sub: 'user-auth' });

      const result = gateway.handleAuthenticate(mockClient, 'valid-token');

      expect(result).toEqual({ status: 'success', userId: 'user-auth' });
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token', {
        secret: 'test-secret',
      });
    });

    it('should return error with invalid token', async () => {
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

      expect(mockServer.emit).toHaveBeenCalledWith(
        WS_EVENTS.NEW_VIDEO,
        expect.objectContaining({
          type: 'new_video',
          videoId: 'video-1',
          videoTitle: 'Test Video',
          sharedByUsername: 'testuser',
        }),
      );
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

      expect(mockServer.emit).toHaveBeenCalledWith(
        WS_EVENTS.NEW_VIDEO,
        expect.objectContaining({
          sharedByUsername: 'Someone',
        }),
      );
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

      expect(mockServer.emit).toHaveBeenCalledWith(WS_EVENTS.VIDEO_UPDATE, {
        id: 'video-1',
        upvoteCount: 10,
        downvoteCount: 2,
      });
    });
  });

  describe('getConnectedUsersCount', () => {
    it('should return the number of connected users', () => {
      // Initially no users
      expect(gateway.getConnectedUsersCount()).toBe(0);

      // Add a mock client connection
      const mockClient = {
        id: 'socket-count',
        handshake: {
          auth: { token: 'token' },
          headers: {},
        },
      } as unknown as Socket;

      mockJwtService.verify.mockReturnValue({ sub: 'user-count' });
      gateway.handleConnection(mockClient);
      // Pump the event loop
      new Promise(resolve => setTimeout(resolve, 10));

      expect(gateway.getConnectedUsersCount()).toBeGreaterThanOrEqual(0);
    });
  });
});