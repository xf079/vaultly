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
} from 'class-validator';

/**
 * 发起密码重置请求 DTO
 */
export class InitiatePasswordResetDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    example: 'user@example.com',
    description: '注册邮箱',
  })
  email!: string;
}

/**
 * 完成密码重置请求 DTO
 * 零知识：客户端提交新的 SRP 参数，服务端不接触明文密码
 */
export class CompletePasswordResetDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    example: 'user@example.com',
    description: '注册邮箱',
  })
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  @ApiProperty({
    example: '123456',
    description: '6位数字验证码',
  })
  code!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(44)
  @MaxLength(44)
  @ApiProperty({
    example: 'U2FsdGVkX1+abc123...',
    description: '新的 SRP 盐（Base64 编码，32字节）',
  })
  srpSalt!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(512)
  @ApiProperty({
    example: 'def456...',
    description: '新的 SRP 验证子（Base64 编码，g^x mod N）',
  })
  srpVerifier!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-f0-9]{64}$/i)
  @ApiProperty({
    example: 'sha256:ghi789...',
    description: '新的 Secret Key 的 SHA256 指纹（64字符十六进制）',
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
}
