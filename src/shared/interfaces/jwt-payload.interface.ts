/**
 * JWT 荷载接口
 * 与 JwtService.sign() 签发时一致，用于 JwtStrategy.validate() 及全局类型引用
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
