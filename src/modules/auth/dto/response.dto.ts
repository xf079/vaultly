import { ApiProperty } from '@nestjs/swagger';

export class EmailAvailableResponseDto {
  @ApiProperty({
    example: true,
    description: '邮箱是否可用',
  })
  available!: boolean;
}

/**
 * 发送注册验证码响应DTO
 * @example
 * {
 *   "expires_in": 600,
 *   "masked_email": "u***@example.com"
 * }
 */
export class SendRegisterCodeResponseDto {
  @ApiProperty({
    example: 600,
    description: '验证码有效期',
  })
  expiresIn!: number;

  @ApiProperty({
    example: 'user@example.com',
    description: '邮箱（掩码）',
  })
  maskedEmail!: string;
}

/**
 * 验证注册验证码响应DTO
 * @example
 * {
 *   "verification_token": "vrt_7a3b9c1d2e5f8a0b",
 *   "expires_in": 600
 * }
 */
export class VerifyRegisterCodeResponseDto {
  @ApiProperty({
    example: 'vrt_7a3b9c1d2e5f8a0b',
    description: '验证码Token',
  })
  verificationToken!: string;

  @ApiProperty({
    example: 600,
    description: '验证码有效期',
  })
  expiresIn!: number;
}

export class LoginResponseDto {
  @ApiProperty({
    example: 'token',
    description: 'Token',
  })
  token!: string;
}

export class RegisterResponseDto {
  @ApiProperty({
    example: 'acc_5f8e7d6c4b3a',
    description: 'Account UUID',
  })
  accountUuid!: string;

  @ApiProperty({
    example:
      'https://cdn.yourvault.com/kits/kit_acc_5f8e7d6c4b3a.pdf?token=xyz&expires=1707235200',
    description: 'Emergency Kit URL',
  })
  emergencyKitUrl!: string;

  @ApiProperty({
    example: 3600,
    description: 'Emergency Kit Expires In',
  })
  emergencyKitExpiresIn!: number;

  @ApiProperty({
    example: 'download_emergency_kit',
    description: 'Next Step',
  })
  nextStep!: string;
}
