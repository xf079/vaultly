import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  SRP_N_3072 as N,
  SRP_G as g,
  srpHash,
  bigIntToBuffer,
  bufferToBigInt,
  mod,
  modPow,
  padBuffer,
  computeK,
  computeU,
} from '@/utils/srp.util';

const PAD_LEN = bigIntToBuffer(N).length; // 384 for 3072-bit N

function parseBase64ToBigInt(s: string): bigint {
  const buf = Buffer.from(s, 'base64');
  return bufferToBigInt(buf);
}

function bigIntToBase64(n: bigint, padBytes = PAD_LEN): string {
  let buf = bigIntToBuffer(n);
  if (buf.length < padBytes) {
    const padded = Buffer.alloc(padBytes);
    buf.copy(padded, padBytes - buf.length);
    buf = padded;
  }
  return buf.toString('base64');
}

/**
 * SRP-6a 服务端
 * 1. loginChallenge: 生成服务端密钥对 (b, B)，B = k*v + g^b mod N
 * 2. loginVerify: 验证客户端证据 M1
 */
@Injectable()
export class SrpService {
  /**
   * 生成服务端密钥对，用于 SRP 挑战
   * @param verifierBase64 SRP 验证子（Base64，来自账户表）
   * @returns { b, B } 私钥 b 与公钥 B（B 为 base64，b 为 hex 供 Redis 缓存）
   */
  generateServerKeyPair(verifierBase64: string): { b: string; B: string } {
    const v = parseBase64ToBigInt(verifierBase64);
    const k = computeK(N, g);

    // b 为随机数，约 256 位
    const bBuf = crypto.randomBytes(32);
    const b = bufferToBigInt(bBuf);

    const gb = modPow(g, b, N);
    const B = mod(k * v + gb, N);
    const BBase64 = bigIntToBase64(B);

    return { b: bBuf.toString('hex'), B: BBase64 };
  }

  /**
   * 验证客户端证据 M1（SRP-6a: M1 = H(A, B, K)，K = H(S)，S = (A * v^u)^b）
   */
  verifyClient(params: {
    srpA: string;
    srpB: string;
    srpb: string;
    srpM1: string;
    verifier: string;
  }): { valid: boolean } {
    const A = parseBase64ToBigInt(params.srpA);
    const B = parseBase64ToBigInt(params.srpB);
    const b = BigInt('0x' + params.srpb);
    const v = parseBase64ToBigInt(params.verifier);

    if (A % N === BigInt(0)) return { valid: false };
    if (B % N === BigInt(0)) return { valid: false };

    const u = computeU(N, A, B);
    const S = mod(modPow(A * modPow(v, u, N), b, N), N);
    const K = srpHash(bigIntToBuffer(S));
    const aPadded = padBuffer(bigIntToBuffer(A), PAD_LEN);
    const bPadded = padBuffer(bigIntToBuffer(B), PAD_LEN);
    const M1 = srpHash(Buffer.concat([aPadded, bPadded, K]));

    let clientM1: Buffer;
    if (/^[a-fA-F0-9]+$/.test(params.srpM1) && params.srpM1.length === 64) {
      clientM1 = Buffer.from(params.srpM1, 'hex');
    } else {
      clientM1 = Buffer.from(params.srpM1, 'base64');
    }
    if (M1.length !== clientM1.length) return { valid: false };
    return { valid: crypto.timingSafeEqual(M1, clientM1) };
  }
}
