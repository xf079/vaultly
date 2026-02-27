import * as crypto from 'crypto';

/**
 * RFC 5054 - 3072-bit 群参数 N
 */
export const SRP_N_3072 = BigInt(
  '0x' +
    'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1' +
    '29024E088A67CC74020BBEA63B139B22514A08798E3404DD' +
    'EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245' +
    'E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED' +
    'EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D' +
    'C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F' +
    '83655D23DCA3AD961C62F356208552BB9ED529077096966D' +
    '670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B' +
    'E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9' +
    'DE2BCBF6955817183995497CEA956AE515D2261898FA0510' +
    '15728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64' +
    'ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7' +
    'ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6B' +
    'F12FFA06D98A0864D87602733EC86A64521F2B18177B200CB' +
    'BE117577A615D6C770988C0BAD946E208E24FA074E5AB3143' +
    'DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF',
);

/**
 * 生成元 g
 */
export const SRP_G = BigInt(5);

/** SHA-256 哈希 */
export function srpHash(data: Buffer): Buffer {
  return crypto.createHash('sha256').update(data).digest();
}

/** BigInt → Buffer (big-endian, unsigned) */
export function bigIntToBuffer(n: bigint): Buffer {
  let hex = n.toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  return Buffer.from(hex, 'hex');
}

/** Buffer → BigInt (big-endian, unsigned) */
export function bufferToBigInt(buf: Buffer): bigint {
  return BigInt('0x' + buf.toString('hex'));
}

/** 正数取模 */
export function mod(a: bigint, m: bigint): bigint {
  return ((a % m) + m) % m;
}

/** 模幂运算 a^b mod m */
export function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (modulus === BigInt(1)) return BigInt(0);
  let result = BigInt(1);
  base = mod(base, modulus);
  while (exponent > BigInt(0)) {
    if (exponent % BigInt(2) === BigInt(1)) {
      result = mod(result * base, modulus);
    }
    exponent = exponent / BigInt(2);
    base = mod(base * base, modulus);
  }
  return result;
}

/** 左侧填充 Buffer 到指定长度 */
export function padBuffer(buf: Buffer, length: number): Buffer {
  if (buf.length >= length) return buf;
  const padded = Buffer.alloc(length);
  buf.copy(padded, length - buf.length);
  return padded;
}

/** 计算 k = H(N, g) */
export function computeK(N: bigint, g: bigint): bigint {
  const padLen = bigIntToBuffer(N).length;
  const gPadded = Buffer.alloc(padLen);
  const gBuf = bigIntToBuffer(g);
  gBuf.copy(gPadded, padLen - gBuf.length);

  return bufferToBigInt(srpHash(Buffer.concat([bigIntToBuffer(N), gPadded])));
}

/** 计算 u = H(A, B) */
export function computeU(N: bigint, A: bigint, B: bigint): bigint {
  const padLen = bigIntToBuffer(N).length;
  const aPadded = padBuffer(bigIntToBuffer(A), padLen);
  const bPadded = padBuffer(bigIntToBuffer(B), padLen);
  return bufferToBigInt(srpHash(Buffer.concat([aPadded, bPadded])));
}

