import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '@/app.module';
import { buildSwaggerDocument } from '@/config/swagger.config';

const SWAGGER_PATH = 'api-docs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const document = SwaggerModule.createDocument(app, buildSwaggerDocument());
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const baseUrl = `http://localhost:${port}`;
  Logger.log(`Application is running on: ${baseUrl}`, 'Bootstrap');
  Logger.log(`Swagger 文档: ${baseUrl}/${SWAGGER_PATH}`, 'Bootstrap');
}
void bootstrap();
