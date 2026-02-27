import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ItemCategory } from '@/generated/prisma/enums';

/**
 * 创建条目请求 DTO
 * 零知识：dataEncrypted 为客户端加密的完整条目 JSON
 */
export class CreateItemDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '条目数据（完整 JSON 加密后 Base64）',
    example: 'U2FsdGVkX1+...',
  })
  dataEncrypted!: string;

  @IsNotEmpty()
  @IsEnum(ItemCategory)
  @ApiProperty({
    enum: ItemCategory,
    description: '条目分类',
    example: 'LOGIN',
  })
  category!: ItemCategory;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ description: '是否收藏', required: false, default: false })
  favorite?: boolean;
}

/**
 * 更新条目请求 DTO（全部可选）
 * changeReason 会写入版本历史
 */
export class UpdateItemDto extends PartialType(CreateItemDto) {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiProperty({
    description: '变更原因（写入版本历史）',
    required: false,
    example: '密码更新',
  })
  changeReason?: string;
}
