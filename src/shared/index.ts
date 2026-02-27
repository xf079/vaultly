/**
 * @file index.ts
 * @description 共享模块导出文件
 * @module shared/index
 *
 * @author xfo79k@gmail.com
 * @copyright Copyright (c) 2026 xfo79k@gmail.com. All rights reserved.
 * @license UNLICENSED
 * @since 2026-02
 */
export type { JwtPayload } from './interfaces/jwt-payload.interface';
export { CurrentAccount } from './decorators/current-account.decorator';
export { DeviceFingerprint } from './decorators/device-fingerprint.decorator';

export { JwtAuthGuard } from './guards/jwt-auth.guard';
export { AuditService } from './services/audit.service';
export type { AuditLogInput } from './services/audit.service';
