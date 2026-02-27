/**
 * @file jwt-payload.interface.ts
 * @description JWT 荷载接口，与 JwtService.sign() 签发时一致，用于 JwtStrategy.validate() 及全局类型引用
 * @module shared/interfaces/jwt-payload.interface
 *
 * @author xfo79k@gmail.com
 * @copyright Copyright (c) 2026 xfo79k@gmail.com. All rights reserved.
 * @license UNLICENSED
 * @since 2026-02
 */
/**
 * JWT 荷载接口，与 JwtService.sign() 签发时一致，用于 JwtStrategy.validate() 及全局类型引用
 */
export interface JwtPayload {
  /** 账户 ID（subject） */
  sub: string;
  /** 邮箱 */
  email?: string;
  /** JWT ID（用于吊销） */
  jti?: string;
  /** 签发时间 */
  iat?: number;
  /** 过期时间 */
  exp?: number;
  /** 签发方 */
  iss?: string;
  /** 受众 */
  aud?: string;
}
