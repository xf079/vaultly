/**
 * @file shared.module.ts
 * @description 共享模块，负责配置和管理所有共享功能
 * @module shared.module
 *
 * @author xfo79k@gmail.com
 * @copyright Copyright (c) 2026 xfo79k@gmail.com. All rights reserved.
 * @license UNLICENSED
 * @since 2026-02
 */
import { Module } from '@nestjs/common';
import { AuditService } from './services/audit.service';

@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class SharedModule {}
