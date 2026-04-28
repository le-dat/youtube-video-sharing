import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuardImpl } from './throttler.guard';

describe('ThrottlerGuardImpl', () => {
  let guard: ThrottlerGuardImpl;
  let mockReflector: jest.Mocked<Reflector>;
  let mockContext: jest.Mocked<ExecutionContext>;
  let mockHandler: jest.Mock;
  let mockClass: jest.Mock;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    guard = Object.create(ThrottlerGuardImpl.prototype);
    guard.reflector = mockReflector;

    mockHandler = jest.fn();
    mockClass = jest.fn();

    mockContext = {
      getHandler: jest.fn().mockReturnValue(mockHandler),
      getClass: jest.fn().mockReturnValue(mockClass),
    } as unknown as jest.Mocked<ExecutionContext>;
  });

  describe('shouldSkip', () => {
    it('should return true when IS_PUBLIC_KEY is set (public endpoint)', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.shouldSkip(mockContext);

      expect(result).toBe(true);
    });

    it('should call super.shouldSkip when endpoint is not public', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      const result = await guard.shouldSkip(mockContext);

      expect(result).toBe(false);
    });
  });
});
