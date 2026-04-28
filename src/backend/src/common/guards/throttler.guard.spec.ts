// import { ExecutionContext } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { ThrottlerGuardImpl } from './throttler.guard';

// describe('ThrottlerGuardImpl', () => {
//   let guard: ThrottlerGuardImpl;
//   let mockReflector: jest.Mocked<Reflector>;
//   let mockContext: jest.Mocked<ExecutionContext>;
//   let mockHandler: jest.Mock;
//   let mockClass: jest.Mock;

//   beforeEach(() => {
//     mockReflector = {
//       getAllAndOverride: jest.fn(),
//     } as unknown as jest.Mocked<Reflector>;

//     // Mock super.shouldSkip to return false by default
//     const mockSuperShouldSkip = jest.fn().mockResolvedValue(false);

//     // We need to test the guard's behavior without calling the actual parent constructor
//     guard = Object.create(ThrottlerGuardImpl.prototype);
//     guard.reflector = mockReflector;

//     mockHandler = jest.fn();
//     mockClass = jest.fn();

//     mockContext = {
//       getHandler: jest.fn().mockReturnValue(mockHandler),
//       getClass: jest.fn().mockReturnValue(mockClass),
//     } as unknown as jest.Mocked<ExecutionContext>;
//   });

//   describe('shouldSkip', () => {
//     it('should return true when IS_PUBLIC_KEY is set (public endpoint)', async () => {
//       mockReflector.getAllAndOverride.mockReturnValue(true);

//       // Bind the method properly since it's an arrow function in the class
//       const result = await guard.shouldSkip.call(guard, mockContext);

//       expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
//         expect.anything(),
//         [mockHandler, mockClass],
//       );
//       expect(result).toBe(true);
//     });

//     it('should call super.shouldSkip when endpoint is not public', async () => {
//       mockReflector.getAllAndOverride.mockReturnValue(false);

//       // We can't easily test super.shouldSkip without the full NestJS setup
//       // But we can verify the reflector was called and public key check returned false
//       const result = await guard.shouldSkip.call(guard, mockContext);

//       expect(mockReflector.getAllAndOverride).toHaveBeenCalled();
//       expect(result).toBe(false);
//     });

//     it('should check reflector for both handler and class metadata', async () => {
//       mockReflector.getAllAndOverride.mockReturnValue(false);

//       await guard.shouldSkip.call(guard, mockContext);

//       // Verify getAllAndOverride was called with IS_PUBLIC_KEY
//       expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
//         expect.anything(),
//         expect.arrayContaining([mockHandler, mockClass]),
//       );
//     });
//   });
// });