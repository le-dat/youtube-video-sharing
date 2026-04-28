import { ExecutionContext } from '@nestjs/common';

const testCurrentUser = (data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx
    .switchToHttp()
    .getRequest<{ user?: Record<string, unknown> }>();
  const user = request.user;
  return data ? user?.[data] : user;
};

describe('CurrentUser Decorator', () => {
  it('should extract specific field from user object', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'user-123', username: 'testuser' },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = testCurrentUser('id', mockContext);

    expect(result).toBe('user-123');
  });

  it('should return full user object when no field specified', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'user-123', username: 'testuser' },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = testCurrentUser(undefined, mockContext);

    expect(result).toEqual({ id: 'user-123', username: 'testuser' });
  });

  it('should return undefined when user is not present', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: undefined,
        }),
      }),
    } as unknown as ExecutionContext;

    const result = testCurrentUser('id', mockContext);

    expect(result).toBeUndefined();
  });

  it('should return undefined for non-existent field', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'user-123', username: 'testuser' },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = testCurrentUser('email', mockContext);

    expect(result).toBeUndefined();
  });
});
