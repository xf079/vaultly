/**
 * @file prisma.service.ts
 * @description 数据库服务，负责配置和管理数据库
 * @module prisma.service
 *
 * @author xfo79k@gmail.com
 * @copyright Copyright (c) 2026 xfo79k@gmail.com. All rights reserved.
 * @license UNLICENSED
 * @since 2026-02
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(config: ConfigService) {
    const url = config.get<string>('DATABASE_URL', ':memory:');
    const adapter = new PrismaBetterSqlite3({ url: url });
    super({ adapter });
  }
}
