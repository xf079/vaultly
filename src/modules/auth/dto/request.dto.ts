import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
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

  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-f0-9]{32,64}$/i)
  @ApiProperty({
    example: 'a1b2c3d4e5f6...',
    description: 'PBKDF2 每用户随机盐（hex，16–32 字节）',
  })
  passwordSalt!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-f0-9]{64}$/i)
  @ApiProperty({
    example: 'e7f8...64hex',
    description: 'PBKDF2 密码哈希（hex，SHA-256 32 字节）',
  })
  passwordEncrypted!: string;

  @ValidateNested()
  @Type(() => ClientMetadataDto)
  @ApiProperty({
    type: ClientMetadataDto,
    description: '客户端设备元数据',
  })
  clientMetadata!: ClientMetadataDto;
}

/**
 * 邮箱 + 密码登录请求 DTO
 * 信任设备：邮箱+密码即可；新/未信任设备：还需传 secretKeyFingerprint
 */
export class LoginPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    example: 'user@example.com',
    description: '邮箱',
  })
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @ApiProperty({
    example: 'mySecurePassword123',
    description: '账户密码（明文）',
    minLength: 8,
  })
  password!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(64)
  @MaxLength(64)
  @ApiProperty({
    example: 'a1b2c3...64hex',
    description: '设备指纹（64 字符 hex）',
  })
  deviceFingerprint!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-f0-9]{64}$/i)
  @ApiProperty({
    example: 'sha256:ghi789...',
    description: 'Secret Key 指纹（新/未信任设备必填）',
    required: false,
  })
  secretKeyFingerprint?: string;

  @ValidateNested()
  @Type(() => ClientMetadataDto)
  @ApiProperty({
    type: ClientMetadataDto,
    description: '客户端设备元数据',
  })
  clientMetadata!: ClientMetadataDto;
}

/**
 * 登录挑战请求 DTO
 * 用于在调用 login/password 前获知是否需要 Secret Key（信任设备可免）
 */
export class LoginChallengeDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    example: 'user@example.com',
    description: '邮箱',
  })
  email!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-f0-9]{64}$/i)
  @ApiProperty({
    example: 'a1b2c3...64hex',
    description:
      '设备指纹（64 字符 hex）；若提供则返回是否需 Secret Key（信任设备为 false）',
    required: false,
  })
  deviceFingerprint?: string;
}

/**
 * SRP 登录验证请求 DTO
 */
export class LoginVerifyDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'acc_5f8e7d6c4b3a',
    description: 'Account UUID（来自 login/challenge）',
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
    description: '客户端 SRP 证据 M1（Base64 或 64 字符 hex）',
  })
  srpM1!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-f0-9]{64}$/i)
  @ApiProperty({
    example: 'sha256:ghi789...',
    description: 'Secret Key 指纹（新设备必填；信任设备可省略）',
    required: false,
  })
  secretKeyFingerprint?: string;

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
