/**
 * @file swagger-setup.ts
 * @description 设置 Swagger 文档
 * @module swagger-setup
 *
 * @author xfo79k@gmail.com
 * @copyright Copyright (c) 2026 xfo79k@gmail.com. All rights reserved.
 * @license UNLICENSED
 * @since 2026-02
 */
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import { buildSwaggerDocument } from '@/configs';

export function setupSwagger(app: INestApplication) {
  const config = app.get(ConfigService);
  const swaggerPath = config.get<string>('SWAGGER_PATH', 'api-docs');
  const document = SwaggerModule.createDocument(
    app,
    buildSwaggerDocument({
      title: config.get('SWAGGER_TITLE'),
      description: config.get('SWAGGER_DESCRIPTION'),
      version: config.get('SWAGGER_VERSION'),
    }),
  );
  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: config.get('SWAGGER_PERSIST_AUTHORIZATION', true),
    },
  });
}
