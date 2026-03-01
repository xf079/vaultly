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

// ─── 登录挑战响应 DTO ────────────────────────────────────

export class LoginChallengeResponseDto {
  @ApiProperty({
    example: 'U2FsdGVkX1+abc123...',
    description: 'SRP 盐（Base64，32 字节）',
  })
  srpSalt!: string;

  @ApiProperty({
    example: 'jkl012...',
    description: '服务端 SRP 公钥 B（Base64）',
  })
  srpB!: string;

  @ApiProperty({
    example: 'sha256:ghi789...',
    description: 'Secret Key 指纹（用于客户端提示用户）',
  })
  secretKeyFingerprint!: string;

  @ApiProperty({
    example: 100000,
    description: 'KDF 迭代次数（PBKDF2）',
  })
  kdfIterations!: number;

  @ApiProperty({
    example: 'a1b2c3d4...64hex',
    description:
      'PBKDF2 每用户随机盐（hex）；若使用 login/password 且希望客户端本地预哈希，以此作为 salt',
  })
  passwordSalt!: string;

  @ApiProperty({
    example: 'acc_5f8e7d6c4b3a',
    description: 'Account UUID，后续 login/verify 需要',
  })
  accountUuid!: string;

  @ApiProperty({
    example: true,
    description:
      '是否需要 Secret Key（新/未信任设备为 true，信任设备为 false）',
  })
  requiresSecretKey!: boolean;
}

// ─── 登录响应 DTO ─────────────────────────────────────────

/** 两种登录方式（SRP login/verify 与 login/password）共用此响应结构 */
export class LoginResponseDto {
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
    description: '是否为新/未信任设备',
  })
  isNewDevice!: boolean;

  @ApiProperty({
    example: 'register_device',
    description:
      '下一步指引：register_device（新设备需注册信任）或 sync_vaults（直接同步）',
  })
  nextStep!: string;
}

// ─── 密码重置响应 DTO ─────────────────────────────────────

export class PasswordResetCodeResponseDto {
  @ApiProperty({
    example: '如果邮箱存在，验证码已发送',
    description: '模糊提示，防枚举攻击',
  })
  message!: string;
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

// ─── 会话管理响应 DTO ────────────────────────────────────

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
