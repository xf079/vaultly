/**
 * @file device-fingerprint.decorator.ts
 * @description 设备指纹装饰器，用于从请求头中提取设备指纹
 * @module shared/decorators/device-fingerprint.decorator
 *
 * @author xfo79k@gmail.com
 * @copyright Copyright (c) 2026 xfo79k@gmail.com. All rights reserved.
 * @license UNLICENSED
 * @since 2026-02
 */
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
