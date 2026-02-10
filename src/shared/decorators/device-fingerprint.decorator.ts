import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 从请求头中提取设备指纹
 * 客户端需通过 `X-Device-Fingerprint` 请求头传递设备指纹
 *
 * @example
 * ```ts
 * @Post('some-action')
 * doSomething(@DeviceFingerprint() fingerprint: string) {
 *   // fingerprint = 请求头中的 X-Device-Fingerprint 值
 * }
 * ```
 */
export const DeviceFingerprint = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return (request.headers['x-device-fingerprint'] as string) || null;
  },
);
