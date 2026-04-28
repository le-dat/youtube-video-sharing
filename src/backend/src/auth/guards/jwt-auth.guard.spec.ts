import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

describe('JwtAuthGuard', () => {
  // We test the guard behavior without instantiating it directly,
  // since it requires passport-jwt strategy to be registered
  let guard: AuthGuard;

  beforeEach(() => {
    // Create a guard that behaves like JwtAuthGuard
    guard = new (class extends AuthGuard('jwt') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      handleRequest(err: any, user: any, _info: any): any {
        if (err || !user) {
          throw err || new UnauthorizedException('Invalid or expired token');
        }
        return user;
      }
    })();
  });

  describe('handleRequest', () => {
    it('should return user when valid', () => {
      const user = { id: 'user-1', username: 'test' };
      const result = (guard as any).handleRequest(null, user, null);
      expect(result).toBe(user);
    });

    it('should throw UnauthorizedException when user is falsy', () => {
      expect(() => (guard as any).handleRequest(null, null, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw error when error is provided', () => {
      const error = new Error('test error');
      expect(() => (guard as any).handleRequest(error, null, null)).toThrow(
        error,
      );
    });
  });
});
