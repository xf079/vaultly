import * as crypto from 'crypto';

/** PBKDF2 盐字节长度（32 字节 = 64 hex 字符） */
const SALT_BYTES = 32;
/** PBKDF2 输出密钥长度（32 字节 = 64 hex 字符） */
const KEY_LEN = 32;
const DIGEST = 'sha256';

/**
 * 生成随机盐（hex）
 */
export function generatePasswordSalt(): string {
  return crypto.randomBytes(SALT_BYTES).toString('hex');
}

/**
 * 使用 PBKDF2 对明文密码哈希
 * @param password 明文密码
 * @param saltHex 盐（hex）
 * @param iterations 迭代次数
 * @returns 哈希值（hex）
 */
export function hashPassword(
  password: string,
  saltHex: string,
  iterations: number,
): string {
  const salt = Buffer.from(saltHex, 'hex');
  return crypto
    .pbkdf2Sync(password, salt, iterations, KEY_LEN, DIGEST)
    .toString('hex');
}

/**
 * 验证密码（恒定时间比较，防时序攻击）
 * @param password 待验证的明文密码
 * @param saltHex 存储的盐（hex）
 * @param iterations 迭代次数
 * @param storedHashHex 存储的哈希（hex）
 */
export function verifyPassword(
  password: string,
  saltHex: string,
  iterations: number,
  storedHashHex: string,
): boolean {
  const computed = hashPassword(password, saltHex, iterations);
  if (computed.length !== storedHashHex.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(computed, 'hex'),
    Buffer.from(storedHashHex, 'hex'),
  );
}
