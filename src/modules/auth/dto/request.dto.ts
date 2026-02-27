import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClientMetadataDto } from './client-metadata.dto';

/**
 * 发送注册验证码请求 DTO
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
  @IsString()
  @ApiProperty({
    example: 'sha256:abc123...',
    description: '客户端指纹',
  })
  clientFingerprint!: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: '03AGdBq24P...',
    description: 'Captcha Token',
  })
  captchaToken!: string;
}

/**
 * 验证注册验证码请求 DTO
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
  @IsString()
  @ApiProperty({
    example: '123456',
    description: '6位数字验证码',
  })
  code!: string;
}

/**
 * 提交注册请求 DTO
 */
export class RegisterDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    example: 'user@example.com',
    description: '邮箱',
  })
  email!: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'vrt_7a3b9c1d2e5f8a0b',
    description: '邮箱验证令牌（来自验证码验证步骤）',
  })
  verificationToken!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(44)
  @MaxLength(44)
  @ApiProperty({
    example: 'U2FsdGVkX1+abc123...',
    description: 'SRP 盐（Base64 编码，32字节）',
  })
  srpSalt!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(512)
  @ApiProperty({
    example: 'def456...',
    description: 'SRP 验证子（Base64 编码，g^x mod N）',
  })
  srpVerifier!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-f0-9]{64}$/i)
  @ApiProperty({
    example: 'sha256:ghi789...',
    description: 'Secret Key 的 SHA256 指纹（64字符十六进制）',
  })
  secretKeyFingerprint!: string;

  @IsInt()
  @Min(10000)
  @Max(500000)
  @ApiProperty({
    example: 100000,
    description: 'PBKDF2 KDF 迭代次数',
  })
  kdfIterations!: number;

  @ValidateNested()
  @Type(() => ClientMetadataDto)
  @ApiProperty({
    type: ClientMetadataDto,
    description: '客户端设备元数据',
  })
  clientMetadata!: ClientMetadataDto;
}

/**
 * 获取登录挑战请求 DTO
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
 * 验证登录请求 DTO
 */
export class LoginVerifyDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'acc_5f8e7d6c4b3a',
    description: 'Account UUID',
  })
  accountUuid!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(44)
  @ApiProperty({
    example: 'base64:mno345...',
    description: '客户端 SRP 公钥 A（Base64）',
  })
  srpA!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(44)
  @ApiProperty({
    example: 'base64:pqr678...',
    description: '客户端 SRP 证据 M1（Base64）',
  })
  srpM1!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-f0-9]{64}$/i)
  @ApiProperty({
    example: 'sha256:ghi789...',
    description: 'Secret Key 指纹',
  })
  secretKeyFingerprint!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(64)
  @MaxLength(64)
  @ApiProperty({
    example: 'sha256:stu901...',
    description: '设备指纹',
  })
  deviceFingerprint!: string;

  @ValidateNested()
  @Type(() => ClientMetadataDto)
  @ApiProperty({
    type: ClientMetadataDto,
    description: '客户端设备元数据',
  })
  clientMetadata!: ClientMetadataDto;
}

/**
 * 注册可信设备请求 DTO
 */
export class TrustDeviceDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @ApiProperty({
    example: 'iPhone 15 Pro',
    description: '设备名称',
  })
  deviceName!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(64)
  @MaxLength(64)
  @ApiProperty({
    example: 'sha256:stu901...',
    description: '设备指纹',
  })
  deviceFingerprint!: string;

  @ValidateNested()
  @Type(() => ClientMetadataDto)
  @ApiProperty({
    type: ClientMetadataDto,
    description: '客户端设备元数据',
  })
  clientMetadata!: ClientMetadataDto;
}
