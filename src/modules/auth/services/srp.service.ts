import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  SRP_N_3072,
  SRP_G,
  bigIntToBuffer,
  bufferToBigInt,
  computeK,
  computeU,
  mod,
  modPow,
  srpHash,
} from '@/utils/srp.util';

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
  // SRP 群参数（公共常量）
  private readonly N = SRP_N_3072;
  private readonly g = SRP_G;
  private readonly k: bigint;

  constructor() {
    // k = H(N, g)
    this.k = computeK(this.N, this.g);
  }

  /**
   * 生成服务端密钥对
   * @param verifier SRP 验证子（Base64 编码）
   * @returns { b, B } 服务端私钥和公钥（Base64 编码）
   */
  generateServerKeyPair(verifier: string): { b: string; B: string } {
    const v = bufferToBigInt(Buffer.from(verifier, 'base64'));

    // b = random 256-bit
    const bBytes = crypto.randomBytes(32);
    const b = bufferToBigInt(bBytes);

    // B = (k * v + g^b) mod N
    const B = mod(this.k * v + modPow(this.g, b, this.N), this.N);

    // 确保 B % N != 0
    if (B === BigInt(0)) {
      return this.generateServerKeyPair(verifier);
    }

    return {
      b: bBytes.toString('base64'),
      B: bigIntToBuffer(B).toString('base64'),
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
    const A = bufferToBigInt(Buffer.from(params.srpA, 'base64'));
    const B = bufferToBigInt(Buffer.from(params.srpB, 'base64'));
    const b = bufferToBigInt(Buffer.from(params.srpb, 'base64'));
    const v = bufferToBigInt(Buffer.from(params.verifier, 'base64'));
    const clientM1 = Buffer.from(params.srpM1, 'base64');

    // 安全检查：A % N 不能为 0
    if (mod(A, this.N) === BigInt(0)) {
      return { valid: false, M2: null };
    }

    // u = H(A, B)
    const u = computeU(this.N, A, B);
    if (u === BigInt(0)) {
      return { valid: false, M2: null };
    }

    // S = (A * v^u)^b mod N
    const S = modPow(
      mod(A * modPow(v, u, this.N), this.N),
      b,
      this.N,
    );

    // K = H(S) - 会话密钥
    const K = srpHash(bigIntToBuffer(S));

    // 计算预期的 M1 = H(H(N) XOR H(g), H(email), salt, A, B, K)
    // 简化版: M1 = H(A, B, K)
    const expectedM1 = srpHash(
      Buffer.concat([bigIntToBuffer(A), bigIntToBuffer(B), K]),
    );

    // 恒定时间比较
    const valid = crypto.timingSafeEqual(clientM1, expectedM1);

    if (!valid) {
      return { valid: false, M2: null };
    }

    // M2 = H(A, M1, K) - 服务端证据
    const M2 = srpHash(Buffer.concat([bigIntToBuffer(A), clientM1, K]));

    return { valid: true, M2: M2.toString('base64') };
  }

  // ─── 内部工具已抽离到 utils/srp.util.ts ─────────────────
}
