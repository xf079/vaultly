import { registerAs } from '@nestjs/config';
import { DocumentBuilder, type OpenAPIObject } from '@nestjs/swagger';

export default registerAs('swagger', () => ({
  path: process.env.SWAGGER_PATH ?? 'api-docs',
  title: process.env.SWAGGER_TITLE ?? 'Vaultly API',
  description: process.env.SWAGGER_DESCRIPTION,
  version: process.env.SWAGGER_VERSION ?? '1.0.0',
  persistAuthorization: true,
}));

export function buildSwaggerDocument(
  overrides?: Partial<{ title: string; description: string; version: string }>,
): Omit<OpenAPIObject, 'paths'> {
  const title = overrides?.title ?? 'Vaultly API';
  const description = overrides?.description ?? '';
  const version = overrides?.version ?? '1.0.0';

  return new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'bearer',
    )
    .addTag('auth', '授权')
    .build();
}
