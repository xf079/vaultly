import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '@/shared/interfaces/jwt-payload.interface';

/**
 * 从请求上下文中提取当前认证账户信息
 * 由 JwtStrategy.validate() 验证后注入到 req.user
 *
 * @example
 * ```ts
 * @Get('profile')
 * @UseGuards(AuthGuard('jwt'))
 * getProfile(@CurrentAccount() account: JwtPayload) {
 *   return account.sub; // accountId
 * }
 * ```
 */
export const CurrentAccount = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);
