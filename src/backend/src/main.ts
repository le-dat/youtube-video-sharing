import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api');

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Enable graceful shutdown
  app.enableShutdownHooks();

  // Security headers
  app.use(helmet());

  // CORS - validate origin is a proper URL or array of URLs in production
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  // Request logging - 'dev' for dev (readable), 'combined' for production (structured)
  app.use(morgan(isProduction ? 'combined' : 'dev'));

  // Parse cookies for auth
  app.use(cookieParser());

  if (isProduction) {
    if (!corsOrigin || corsOrigin === '') {
      throw new Error(
        'CORS_ORIGIN environment variable must be set in production',
      );
    }
    app.enableCors({
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    });
  } else {
    // In development, allow any origin but respect credentials
    app.enableCors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    });
  }

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('YouTube Sharing API')
    .setDescription(
      'API for sharing YouTube videos with real-time notifications',
    )
    .setVersion('1.0')
    .addCookieAuth(
      'accessToken',
      { type: 'apiKey', in: 'cookie' },
      'accessToken',
    )
    .addCookieAuth(
      'refreshToken',
      { type: 'apiKey', in: 'cookie' },
      'refreshToken',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global response transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = configService.get<number>('PORT') ?? 5000;
  await app.listen(port);
  console.log(`Server running on port ${port}`);
}

void bootstrap();
