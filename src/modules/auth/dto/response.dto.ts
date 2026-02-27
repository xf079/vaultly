import { ApiProperty } from '@nestjs/swagger';

// ─── 注册流程响应 DTOs ───────────────────────────────────

export class EmailAvailableResponseDto {
  @ApiProperty({
    example: true,
    description: '邮箱是否可用',
  })
  available!: boolean;
}

export class SendRegisterCodeResponseDto {
  @ApiProperty({
    example: 600,
    description: '验证码有效期（秒）',
  })
  expiresIn!: number;

  @ApiProperty({
    example: 'u***@example.com',
    description: '掩码后的邮箱',
  })
  maskedEmail!: string;
}

export class VerifyRegisterCodeResponseDto {
  @ApiProperty({
    example: 'vrt_7a3b9c1d2e5f8a0b',
    description: '邮箱验证令牌（用于后续注册步骤）',
  })
  verificationToken!: string;

  @ApiProperty({
    example: 600,
    description: '令牌有效期（秒）',
  })
  expiresIn!: number;
}

export class LoginChallengeResponseDto {
  @ApiProperty({
    example: 'U2FsdGVkX1+abc123...',
    description: 'SRP 盐（Base64 编码）',
  })
  srpSalt!: string;

  @ApiProperty({
    example: 'jkl012...',
    description: '服务端 SRP 公钥 B（Base64 编码）',
  })
  srpB!: string;

  @ApiProperty({
    example: 'sha256:ghi789...',
    description: 'Secret Key 指纹（用于客户端提示）',
  })
  secretKeyFingerprint!: string;

  @ApiProperty({
    example: 100000,
    description: 'KDF 迭代次数',
  })
  kdfIterations!: number;

  @ApiProperty({
    example: 'acc_5f8e7d6c4b3a',
    description: 'Account UUID',
  })
  accountUuid!: string;

  @ApiProperty({
    example: true,
    description: '是否为新设备（新设备需输入 Secret Key）',
  })
  requiresSecretKey!: boolean;
}

export class LoginVerifyResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: '会话令牌（JWT）',
  })
  sessionToken!: string;

  @ApiProperty({
    example: 86400,
    description: '令牌有效期（秒）',
  })
  expiresIn!: number;

  @ApiProperty({
    example: true,
    description: '是否为新设备',
  })
  isNewDevice!: boolean;

  @ApiProperty({
    example: 'register_device',
    description: '下一步操作指引（register_device 或 sync_vaults）',
  })
  nextStep!: string;
}

// ─── 设备信任响应 DTO ────────────────────────────────────

export class TrustDeviceResponseDto {
  @ApiProperty({
    example: 'dev_9f8e7d6c4b3a',
    description: '设备 ID',
  })
  deviceId!: string;

  @ApiProperty({
    example: '2027-02-06T18:19:30Z',
    description: '信任有效期至',
  })
  trustedUntil!: string;
}

// ─── 会话管理响应 DTOs ───────────────────────────────────

export class SessionRefreshResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: '新的会话令牌',
  })
  sessionToken!: string;

  @ApiProperty({
    example: 86400,
    description: '新令牌有效期（秒）',
  })
  expiresIn!: number;
}
