import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard as NestThrottlerGuard } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ThrottlerGuardImpl extends NestThrottlerGuard {
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly _opts: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly _storage: any,
    private readonly _reflector: Reflector,
  ) {
    super(_opts, _storage, _reflector);
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const isPublic = this._reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.shouldSkip(context);
  }
}
