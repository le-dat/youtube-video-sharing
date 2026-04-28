import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;
  let mockContext: jest.Mocked<ExecutionContext>;
  let mockNext: jest.Mocked<CallHandler>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue({}),
        getRequest: jest.fn().mockReturnValue({}),
      }),
    } as unknown as jest.Mocked<ExecutionContext>;

    mockNext = {
      handle: jest.fn(),
    };
  });

  describe('intercept', () => {
    it('should wrap response data with success true and timestamp', (done) => {
      const mockData = { id: '1', name: 'test' };
      mockNext.handle.mockReturnValue(of(mockData));

      interceptor.intercept(mockContext, mockNext).subscribe((result) => {
        expect(result).toHaveProperty('success', true);
        expect(result).toHaveProperty('data', mockData);
        expect(result).toHaveProperty('timestamp');
        expect(typeof result.timestamp).toBe('string');
        done();
      });
    });

    it('should preserve the original data in the data field', (done) => {
      const mockData = { foo: 'bar', count: 42 };
      mockNext.handle.mockReturnValue(of(mockData));

      interceptor.intercept(mockContext, mockNext).subscribe((result) => {
        expect(result.data).toEqual(mockData);
        done();
      });
    });

    it('should handle empty object response', (done) => {
      mockNext.handle.mockReturnValue(of({}));

      interceptor.intercept(mockContext, mockNext).subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.data).toEqual({});
        done();
      });
    });

    it('should handle array response', (done) => {
      const mockData = [1, 2, 3];
      mockNext.handle.mockReturnValue(of(mockData));

      interceptor.intercept(mockContext, mockNext).subscribe((result) => {
        expect(result.data).toEqual([1, 2, 3]);
        expect(Array.isArray(result.data)).toBe(true);
        done();
      });
    });

    it('should include ISO timestamp', (done) => {
      mockNext.handle.mockReturnValue(of({ test: true }));

      interceptor.intercept(mockContext, mockNext).subscribe((result) => {
        const timestamp = new Date(result.timestamp);
        expect(timestamp.getTime()).not.toBeNaN();
        done();
      });
    });
  });
});
