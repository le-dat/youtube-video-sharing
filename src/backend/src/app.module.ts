import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuardImpl } from './common/guards/throttler.guard';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV');
        const isProduction = nodeEnv === 'production';
        const isDevelopment = nodeEnv === 'development';

        // In production, ensure critical config exists
        if (isProduction) {
          const requiredVars = [
            'DATABASE_HOST',
            'DATABASE_PORT',
            'DATABASE_NAME',
            'DATABASE_USER',
            'DATABASE_PASSWORD',
          ];
          for (const varName of requiredVars) {
            if (!configService.get(varName)) {
              throw new Error(
                `${varName} environment variable must be set in production`,
              );
            }
          }
        }

        return {
          type: 'postgres',
          host: configService.get('DATABASE_HOST') ?? 'localhost',
          port: configService.get<number>('DATABASE_PORT') ?? 5432,
          database: configService.get('DATABASE_NAME') ?? 'app',
          username: configService.get('DATABASE_USER') ?? 'postgres',
          password: configService.get('DATABASE_PASSWORD') ?? '',
          autoLoadEntities: true,
          // Never auto-sync in production - use migrations instead
          synchronize: isDevelopment && !isProduction,
          logging: isDevelopment,
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuardImpl,
    },
  ],
})
export class AppModule {}
