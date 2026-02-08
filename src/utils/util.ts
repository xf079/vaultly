/**
 * 掩码邮箱
 * @param email 邮箱
 * @returns 掩码邮箱
 */
export function maskEmail(email: string) {
  const [name, domain] = email.split('@');
  return `${name[0]}***@${domain}`;
}
