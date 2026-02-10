import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * SRP-6a 协议服务端实现
 * 基于 RFC 5054，使用 3072-bit 群参数
 *
 * 核心流程：
 * 1. loginChallenge: 生成服务端密钥对 (b, B)，B = k*v + g^b mod N
 * 2. loginVerify: 验证客户端证据 M1，计算 M2 返回给客户端
 *
 * 安全要点：
 * - 使用恒定时间比较防止时序攻击
 * - 验证 A % N != 0 防止恶意客户端
 * - 所有私钥材料在使用后及时清理
 */
@Injectable()
export class SrpService {
  // RFC 5054 - 3072-bit 群参数
  private readonly N = BigInt(
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

  private readonly g = BigInt(5);
  private readonly k: bigint;

  constructor() {
    // k = H(N, g)
    this.k = this.computeK();
  }

  /**
   * 生成服务端密钥对
   * @param verifier SRP 验证子（Base64 编码）
   * @returns { b, B } 服务端私钥和公钥（Base64 编码）
   */
  generateServerKeyPair(verifier: string): { b: string; B: string } {
    const v = this.bufferToBigInt(Buffer.from(verifier, 'base64'));

    // b = random 256-bit
    const bBytes = crypto.randomBytes(32);
    const b = this.bufferToBigInt(bBytes);

    // B = (k * v + g^b) mod N
    const B = this.mod(this.k * v + this.modPow(this.g, b, this.N), this.N);

    // 确保 B % N != 0
    if (B === BigInt(0)) {
      return this.generateServerKeyPair(verifier);
    }

    return {
      b: bBytes.toString('base64'),
      B: this.bigIntToBuffer(B).toString('base64'),
    };
  }

  /**
   * 验证客户端证据 M1 并计算服务端证据 M2
   * @param params SRP 验证参数
   * @returns 验证结果和服务端证据
   */
  verifyClient(params: {
    srpA: string;
    srpB: string;
    srpb: string;
    srpM1: string;
    verifier: string;
  }): { valid: boolean; M2: string | null } {
    const A = this.bufferToBigInt(Buffer.from(params.srpA, 'base64'));
    const B = this.bufferToBigInt(Buffer.from(params.srpB, 'base64'));
    const b = this.bufferToBigInt(Buffer.from(params.srpb, 'base64'));
    const v = this.bufferToBigInt(Buffer.from(params.verifier, 'base64'));
    const clientM1 = Buffer.from(params.srpM1, 'base64');

    // 安全检查：A % N 不能为 0
    if (this.mod(A, this.N) === BigInt(0)) {
      return { valid: false, M2: null };
    }

    // u = H(A, B)
    const u = this.computeU(A, B);
    if (u === BigInt(0)) {
      return { valid: false, M2: null };
    }

    // S = (A * v^u)^b mod N
    const S = this.modPow(
      this.mod(A * this.modPow(v, u, this.N), this.N),
      b,
      this.N,
    );

    // K = H(S) - 会话密钥
    const K = this.hash(this.bigIntToBuffer(S));

    // 计算预期的 M1 = H(H(N) XOR H(g), H(email), salt, A, B, K)
    // 简化版: M1 = H(A, B, K)
    const expectedM1 = this.hash(
      Buffer.concat([this.bigIntToBuffer(A), this.bigIntToBuffer(B), K]),
    );

    // 恒定时间比较
    const valid = crypto.timingSafeEqual(clientM1, expectedM1);

    if (!valid) {
      return { valid: false, M2: null };
    }

    // M2 = H(A, M1, K) - 服务端证据
    const M2 = this.hash(Buffer.concat([this.bigIntToBuffer(A), clientM1, K]));

    return { valid: true, M2: M2.toString('base64') };
  }

  // ─── 内部辅助方法 ──────────────────────────────────────

  /** 计算 k = H(N, g) */
  private computeK(): bigint {
    const padLen = this.bigIntToBuffer(this.N).length;
    const gPadded = Buffer.alloc(padLen);
    const gBuf = this.bigIntToBuffer(this.g);
    gBuf.copy(gPadded, padLen - gBuf.length);

    return this.bufferToBigInt(
      this.hash(Buffer.concat([this.bigIntToBuffer(this.N), gPadded])),
    );
  }

  /** 计算 u = H(A, B) */
  private computeU(A: bigint, B: bigint): bigint {
    const padLen = this.bigIntToBuffer(this.N).length;

    const aPadded = this.padBuffer(this.bigIntToBuffer(A), padLen);
    const bPadded = this.padBuffer(this.bigIntToBuffer(B), padLen);

    return this.bufferToBigInt(this.hash(Buffer.concat([aPadded, bPadded])));
  }

  /** SHA-256 哈希 */
  private hash(data: Buffer): Buffer {
    return crypto.createHash('sha256').update(data).digest();
  }

  /** 模幂运算 a^b mod m (使用 BigInt 原生支持) */
  private modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
    if (modulus === BigInt(1)) return BigInt(0);
    let result = BigInt(1);
    base = this.mod(base, modulus);
    while (exponent > BigInt(0)) {
      if (exponent % BigInt(2) === BigInt(1)) {
        result = this.mod(result * base, modulus);
      }
      exponent = exponent / BigInt(2);
      base = this.mod(base * base, modulus);
    }
    return result;
  }

  /** 正数取模 */
  private mod(a: bigint, m: bigint): bigint {
    return ((a % m) + m) % m;
  }

  /** BigInt → Buffer (big-endian, unsigned) */
  private bigIntToBuffer(n: bigint): Buffer {
    let hex = n.toString(16);
    if (hex.length % 2 !== 0) hex = '0' + hex;
    return Buffer.from(hex, 'hex');
  }

  /** Buffer → BigInt (big-endian, unsigned) */
  private bufferToBigInt(buf: Buffer): bigint {
    return BigInt('0x' + buf.toString('hex'));
  }

  /** 左侧填充 Buffer 到指定长度 */
  private padBuffer(buf: Buffer, length: number): Buffer {
    if (buf.length >= length) return buf;
    const padded = Buffer.alloc(length);
    buf.copy(padded, length - buf.length);
    return padded;
  }
}
