import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '@/app.module';
import { buildSwaggerDocument } from '@/configs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix(config.get<string>('API_PREFIX', 'api'));

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

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

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);

  const baseUrl = `http://localhost:${port}`;
  Logger.log(`Application is running on: ${baseUrl}`, 'Bootstrap');
  Logger.log(`Swagger 文档: ${baseUrl}/${swaggerPath}`, 'Bootstrap');
}
void bootstrap();
