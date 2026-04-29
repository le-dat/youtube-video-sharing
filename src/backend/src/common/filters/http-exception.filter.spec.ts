/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpExceptionFilter } from './http-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: jest.Mocked<Response>;
  let mockRequest: jest.Mocked<Request>;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Response>;
    mockRequest = {
      method: 'GET',
      url: '/test',
    } as unknown as jest.Mocked<Request>;
  });

  function mockHost() {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };
  }

  describe('HttpException handling', () => {
    it('should use status from HttpException', () => {
      const host = mockHost() as any;
      filter.catch(new HttpException('Not Found', HttpStatus.NOT_FOUND), host);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should extract string message from HttpException', () => {
      const host = mockHost() as any;
      filter.catch(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
        host,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 404,
          message: 'User not found',
        }),
      );
    });

    it('should extract message from object response', () => {
      const host = mockHost() as any;
      const exception = new HttpException(
        { message: 'Validation failed' },
        HttpStatus.BAD_REQUEST,
      );
      filter.catch(exception, host);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
          statusCode: 400,
        }),
      );
    });

    it('should join array messages with comma', () => {
      const host = mockHost() as any;
      const exception = new HttpException(
        { message: ['Field1 is required', 'Field2 is invalid'] },
        HttpStatus.BAD_REQUEST,
      );
      filter.catch(exception, host);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Field1 is required, Field2 is invalid',
        }),
      );
    });
  });

  describe('plain Error handling', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should show error message in development', () => {
      process.env.NODE_ENV = 'development';
      const host = mockHost() as any;
      filter.catch(new Error('Database connection failed'), host);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Database connection failed',
          statusCode: 500,
        }),
      );
    });

    it('should hide error message in production', () => {
      process.env.NODE_ENV = 'production';
      const host = mockHost() as any;
      filter.catch(new Error('Database connection failed'), host);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Internal server error',
          statusCode: 500,
        }),
      );
    });
  });

  describe('response structure', () => {
    afterEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('should include success: false', () => {
      const host = mockHost() as any;
      filter.catch(new HttpException('Test', HttpStatus.BAD_REQUEST), host);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      );
    });

    it('should include statusCode', () => {
      const host = mockHost() as any;
      filter.catch(new HttpException('Test', HttpStatus.FORBIDDEN), host);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 }),
      );
    });

    it('should include ISO timestamp', () => {
      const host = mockHost() as any;
      filter.catch(new HttpException('Test', 200), host);

      const jsonCall: Record<string, unknown> =
        mockResponse.json.mock.calls[0][0];
      expect(new Date(jsonCall.timestamp as string).getTime()).not.toBeNaN();
    });

    it('should include path in non-production', () => {
      process.env.NODE_ENV = 'development';
      const host = mockHost() as any;
      filter.catch(new HttpException('Test', 400), host);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/test' }),
      );
    });

    it('should not include path in production', () => {
      process.env.NODE_ENV = 'production';
      const host = mockHost() as any;
      filter.catch(new HttpException('Test', 400), host);
      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall).not.toHaveProperty('path');
    });
  });
});
