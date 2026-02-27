import { ApiProperty } from '@nestjs/swagger';
import { AccountStatus } from '@/generated/prisma/enums';

/**
 * 账户统计信息
 */
export class AccountCountDto {
  @ApiProperty({ description: '设备数量', example: 2 })
  devices!: number;

  @ApiProperty({ description: '保险库数量', example: 3 })
  vaults!: number;
}

/**
 * 账户信息响应 DTO
 * 字段对应 Prisma Account 模型（排除敏感字段）
 */
export class AccountProfileResponseDto {
  @ApiProperty({ description: '账户ID', example: 'acc_abc123' })
  id!: string;

  @ApiProperty({ description: '邮箱', example: 'user@example.com' })
  email!: string;

  @ApiProperty({
    enum: AccountStatus,
    description: '账户状态',
    example: 'ACTIVE',
  })
  status!: AccountStatus;

  @ApiProperty({
    description: '邮箱验证时间',
    required: false,
    nullable: true,
  })
  emailVerifiedAt!: Date | null;

  @ApiProperty({ description: '最后密码修改时间' })
  lastPasswordChangeAt!: Date;

  @ApiProperty({
    description: '是否已下载 Emergency Kit',
    example: false,
  })
  emergencyKitDownloaded!: boolean;

  @ApiProperty({
    description: 'PBKDF2 迭代次数',
    example: 100000,
  })
  kdfIterations!: number;

  @ApiProperty({
    type: AccountCountDto,
    description: '关联资源统计',
  })
  _count!: AccountCountDto;
}

/**
 * 密码重置发起响应 DTO
 */
export class PasswordResetInitiatedResponseDto {
  @ApiProperty({
    description: '提示消息',
    example: '如果邮箱存在，验证码已发送',
  })
  message!: string;
}

/**
 * Emergency Kit 下载确认响应 DTO
 */
export class EmergencyKitConfirmResponseDto {
  @ApiProperty({
    description: '确认状态',
    example: true,
  })
  confirmed!: boolean;
}
