/**
 * @file main.ts
 * @description 应用入口文件，负责启动应用
 * @module main
 *
 * @author xfo79k@gmail.com
 * @copyright Copyright (c) 2026 xfo79k@gmail.com. All rights reserved.
 * @license UNLICENSED
 * @since 2026-02
 */
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { setupSwagger } from '@/swagger-setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix(config.get<string>('API_PREFIX', 'api'));

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  setupSwagger(app);

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);

  const baseUrl = `http://localhost:${port}`;
  Logger.log(`Application is running on: ${baseUrl}`, 'Bootstrap');
}
void bootstrap();
