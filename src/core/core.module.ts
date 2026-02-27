/**
 * @file core.module.ts
 * @description 核心模块，负责配置和管理所有核心功能
 * @module core.module
 *
 * @author xfo79k@gmail.com
 * @copyright Copyright (c) 2026 xfo79k@gmail.com. All rights reserved.
 * @license UNLICENSED
 * @since 2026-02
 */
import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ResultInterceptor } from './interceptors/result.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';

@Global()
@Module({
  imports: [
    /**
     * 速率限制
     */
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    /**
     * 邮件配置
     */
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('EMAIL_HOST'),
          port: configService.get<number>('EMAIL_PORT'),
          secure: true,
          auth: {
            user: configService.get<string>('EMAIL_USER'),
            pass: configService.get<string>('EMAIL_PASS'),
          },
        },
        defaults: {
          from: configService.get<string>('EMAIL_FROM'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    /**
     * 结果拦截器
     */
    { provide: APP_INTERCEPTOR, useClass: ResultInterceptor },
    /**
     * 异常过滤器
     */
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
  exports: [MailerModule],
})
export class CoreModule {}
