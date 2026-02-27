/**
 * @file app.module.ts
 * @description 应用主模块，负责配置和管理所有模块
 * @module app.module
 *
 * @author xfo79k@gmail.com
 * @copyright Copyright (c) 2026 xfo79k@gmail.com. All rights reserved.
 * @license UNLICENSED
 * @since 2026-02
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from '@/core/core.module';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { RedisModule } from '@/infrastructure/redis/redis.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { AccountModule } from '@/modules/account/account.module';
import { DeviceModule } from '@/modules/device/device.module';
import { VaultModule } from '@/modules/vault/vault.module';
import { ItemModule } from '@/modules/item/item.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', `.env.${process.env.NODE_ENV}`, '.env'],
    }),
    CoreModule,
    PrismaModule,
    RedisModule.forRootAsync(),
    AuthModule,
    AccountModule,
    DeviceModule,
    VaultModule,
    ItemModule,
  ],
})
export class AppModule {}
