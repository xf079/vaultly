import { ApiProperty } from '@nestjs/swagger';
import { VaultType } from '@/generated/prisma/enums';

/**
 * 保险库数量统计（可选）
 */
export class VaultCountDto {
  @ApiProperty({ description: '条目数量', example: 10 })
  items!: number;

  @ApiProperty({ description: '共享数量', example: 2 })
  shares!: number;
}

/**
 * 保险库单条响应 DTO
 */
export class VaultResponseDto {
  @ApiProperty({ description: '保险库 ID' })
  id!: string;

  @ApiProperty({ description: '创建者账户 ID' })
  accountId!: string;

  @ApiProperty({ description: '名称（加密）' })
  name!: string;

  @ApiProperty({ description: '描述（加密）', nullable: true })
  description!: string | null;

  @ApiProperty({ description: '图标 base64', nullable: true })
  icon!: string | null;

  @ApiProperty({ enum: VaultType, description: '类型' })
  type!: VaultType;

  @ApiProperty({ description: '主密钥' })
  vaultKey!: string;

  @ApiProperty({ description: '是否收藏' })
  isFavorite!: boolean;

  @ApiProperty({ description: '是否归档' })
  isArchived!: boolean;

  @ApiProperty({ description: '创建时间' })
  createdAt!: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt!: Date;

  @ApiProperty({ description: '软删除时间', nullable: true })
  deletedAt!: Date | null;

  @ApiProperty({
    type: VaultCountDto,
    description: '关联数量',
    required: false,
    nullable: true,
  })
  _count?: VaultCountDto | null;
}

/**
 * 保险库列表响应 DTO
 */
export class VaultListResponseDto {
  @ApiProperty({ type: [VaultResponseDto], description: '保险库列表' })
  vaults!: VaultResponseDto[];

  @ApiProperty({ description: '总数（分页时）', required: false })
  total?: number;
}
