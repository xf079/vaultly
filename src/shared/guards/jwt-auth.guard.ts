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
