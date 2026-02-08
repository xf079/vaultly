import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * 发送注册验证码请求DTO
 * @example
 * {
 *   "email": "user@example.com"
 *   "client_fingerprint": "sha256:...",
 *   "captcha_token": "03AGdBq24P..."
 * }
 */
export class SendRegisterCodeDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    example: 'user@example.com',
    description: '邮箱',
  })
  email!: string;

  @IsNotEmpty()
  @ApiProperty({
    example: 'sha256:...',
    description: '客户端指纹',
  })
  client_fingerprint!: string;

  @IsNotEmpty()
  @ApiProperty({
    example: '03AGdBq24P...',
    description: '验证码Token',
  })
  captcha_token!: string;
}

/**
 * 验证注册验证码请求DTO
 * @example
 * {
 *   "email": "user@example.com",
 *   "code": "123456"
 * }
 */
export class VerifyRegisterCodeDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    example: 'user@example.com',
    description: '邮箱',
  })
  email!: string;

  @IsNotEmpty()
  @ApiProperty({
    example: '123456',
    description: '验证码',
  })
  code!: string;
}

/**
 * 获取登录挑战请求DTO
 * @example
 * {
 *   "email": "user@example.com"
 * }
 */
export class LoginChallengeDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    example: 'user@example.com',
    description: '邮箱',
  })
  email!: string;
}

/**
 * 验证登录请求DTO
 * @example
 * {
 *   "account_uuid": "acc_5f8e7d6c4b3a",
 *   "srp_a": "base64:mno345...",
 *   "srp_m1": "base64:pqr678...",
 *   "secret_key_fingerprint": "sha256:ghi789...",
 *   "device_fingerprint": "sha256:stu901..."
 * }
 */
export class LoginVerifyDto {
  @IsNotEmpty()
  @ApiProperty({
    example: 'acc_5f8e7d6c4b3a',
    description: 'Account UUID',
  })
  accountUuid!: string;

  @IsNotEmpty()
  @ApiProperty({
    example: 'base64:mno345...',
    description: 'SRP A',
  })
  srpA!: string;

  @IsNotEmpty()
  @ApiProperty({
    example: 'base64:pqr678...',
    description: 'SRP M1',
  })
  srpM1!: string;

  @IsNotEmpty()
  @ApiProperty({
    example: 'sha256:ghi789...',
    description: 'Secret Key Fingerprint',
  })
  secretKeyFingerprint!: string;

  @IsNotEmpty()
  @ApiProperty({
    example: 'sha256:stu901...',
    description: 'Device Fingerprint',
  })
  deviceFingerprint!: string;

  @IsNotEmpty()
  @ApiProperty({
    example: 100000,
    description: 'KDF Iterations',
  })
  kdfIterations!: number;
}

export class RegisterDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    example: 'user@example.com',
    description: '邮箱',
  })
  email!: string;

  @IsNotEmpty()
  @ApiProperty({
    example: 'password',
    description: '密码',
  })
  password!: string;

  @IsNotEmpty()
  @ApiProperty({
    example: 'base64:...',
    description: 'SRP 盐',
  })
  srpSalt!: string;

  @IsNotEmpty()
  @ApiProperty({
    example: 'g^x mod N',
    description: 'SRP 验证子',
  })
  srpVerifier!: string;

  @IsNotEmpty()
  @ApiProperty({
    example: 'sha256:...',
    description: 'Secret Key 指纹',
  })
  secretKeyFingerprint!: string;

  @IsNotEmpty()
  @ApiProperty({
    example: 100000,
    description: 'PBKDF2 迭代次数',
  })
  kdfIterations!: number;
}
