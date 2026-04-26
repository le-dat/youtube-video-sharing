import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ThrottlerGuardImpl extends ThrottlerGuard {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(args[0], args[1], args[2]);
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.shouldSkip(context);
  }
}