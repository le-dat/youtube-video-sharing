import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard as NestThrottlerGuard } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ThrottlerGuardImpl extends NestThrottlerGuard {
  constructor(
    options: any,

    storage: any,
    reflector: Reflector,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    super(options, storage, reflector);
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
