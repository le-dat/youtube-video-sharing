import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import {
  ThrottlerGuard as NestThrottlerGuard,
  InjectThrottlerStorage,
  getOptionsToken,
} from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type {
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';

@Injectable()
export class ThrottlerGuardImpl extends NestThrottlerGuard {
  constructor(
    @Inject(getOptionsToken()) opts: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storage: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(opts, storage, reflector);
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
