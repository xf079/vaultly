import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { VaultType } from '@/generated/prisma/enums';

/**
 * 创建保险库请求 DTO
 * 零知识：名称、描述、主钥均为客户端加密
 */
export class CreateVaultDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '保险库名称（AES-GCM 加密后 Base64）',
    example: 'U2FsdGVkX1+...',
  })
  name!: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '保险库描述（AES-GCM 加密后 Base64）',
    required: false,
  })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '图标 base64', required: false })
  icon?: string;

  @IsNotEmpty()
  @IsEnum(VaultType)
  @ApiProperty({
    enum: VaultType,
    description: '保险库类型',
    example: 'PERSONAL',
  })
  type!: VaultType;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '主密钥（由 Account Key 加密，客户端加密后 Base64）',
    example: 'U2FsdGVkX1+...',
  })
  vaultKey!: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ description: '是否收藏', required: false, default: false })
  isFavorite?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ description: '是否归档', required: false, default: false })
  isArchived?: boolean;
}

/**
 * 更新保险库请求 DTO（全部可选）
 */
export class UpdateVaultDto extends PartialType(CreateVaultDto) {}
