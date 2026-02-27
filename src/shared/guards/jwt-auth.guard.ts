/**
 * @file jwt-auth.guard.ts
 * @description JWT 认证守卫，用于保护需要认证的接口
 * @module shared/guards/jwt-auth.guard
 *
 * @author xfo79k@gmail.com
 * @copyright Copyright (c) 2026 xfo79k@gmail.com. All rights reserved.
 * @license UNLICENSED
 * @since 2026-02
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT 认证守卫
 * 对 AuthGuard('jwt') 的封装，方便全局复用
 *
 * @example
 * ```ts
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentAccount() user: JwtPayload) { ... }
 * ```
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
