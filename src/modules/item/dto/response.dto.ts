import { ApiProperty } from '@nestjs/swagger';
import { ItemCategory } from '@/generated/prisma/enums';

/**
 * 单条条目响应 DTO
 */
export class ItemResponseDto {
  @ApiProperty({ description: '条目 ID' })
  id!: string;

  @ApiProperty({ description: '所属保险库 ID' })
  vaultId!: string;

  @ApiProperty({ description: '条目数据（加密）' })
  dataEncrypted!: string;

  @ApiProperty({ enum: ItemCategory, description: '分类' })
  category!: ItemCategory;

  @ApiProperty({ description: '是否收藏' })
  favorite!: boolean;

  @ApiProperty({ description: '当前版本 ID', nullable: true })
  currentVersionId!: string | null;

  @ApiProperty({ description: '创建时间' })
  createdAt!: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt!: Date;

  @ApiProperty({ description: '软删除时间', nullable: true })
  deletedAt!: Date | null;
}

/**
 * 条目列表响应 DTO
 */
export class ItemListResponseDto {
  @ApiProperty({ type: [ItemResponseDto], description: '条目列表' })
  items!: ItemResponseDto[];

  @ApiProperty({ description: '总数（分页时）', required: false })
  total?: number;
}

/**
 * 条目版本响应 DTO
 */
export class ItemVersionResponseDto {
  @ApiProperty({ description: '版本 ID' })
  id!: string;

  @ApiProperty({ description: '条目 ID' })
  itemId!: string;

  @ApiProperty({ description: '该版本数据（加密）' })
  dataEncrypted!: string;

  @ApiProperty({ description: '版本号' })
  versionNumber!: number;

  @ApiProperty({ description: '修改者账户 ID' })
  changedBy!: string;

  @ApiProperty({ description: '变更原因', nullable: true })
  changeReason!: string | null;

  @ApiProperty({ description: '创建时间' })
  createdAt!: Date;
}

/**
 * 版本列表响应 DTO
 */
export class ItemVersionListResponseDto {
  @ApiProperty({ type: [ItemVersionResponseDto], description: '版本列表' })
  versions!: ItemVersionResponseDto[];
}
