import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import type { Prisma } from '@/generated/prisma/client';

export class CreateAccountDto implements Prisma.AccountCreateInput {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    example: 'user@example.com',
    description: '邮箱',
  })
  email!: string;

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
