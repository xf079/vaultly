import { DocumentBuilder, type OpenAPIObject } from '@nestjs/swagger';

const title = 'Vaultly API';
const description = 'Vaultly 密码管家 - 企业级 REST API，采用 Result API 统一响应格式';
const version = '1.0.0';

export function buildSwaggerDocument(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'Authorization', in: 'header' },
      'bearer',
    )
    .addTag('users', '用户')
    .addTag('tokens', '令牌')
    .addTag('items', '条目')
    .addTag('devices', '设备')
    .addTag('audit-logs', '审计日志')
    .addTag('share-links', '分享链接')
    .build();
}
