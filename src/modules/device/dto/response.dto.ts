import { ApiProperty } from '@nestjs/swagger';
import { Platform } from '@/generated/prisma/client';

/**
 * 单个设备信息响应 DTO
 */
export class DeviceResponseDto {
  @ApiProperty({ description: '设备ID', example: 'dev_abc123' })
  id!: string;

  @ApiProperty({ description: '设备指纹', example: 'sha256:abc123...' })
  fingerprint!: string;

  @ApiProperty({ description: '设备名称', example: 'iPhone 15 Pro' })
  name!: string;

  @ApiProperty({ enum: Platform, description: '设备平台', example: 'IOS' })
  platform!: Platform;

  @ApiProperty({
    description: '操作系统版本',
    example: '17.2',
    required: false,
  })
  osVersion?: string | null;

  @ApiProperty({ description: '应用版本', example: '1.0.0', required: false })
  appVersion?: string | null;

  @ApiProperty({ description: '是否启用生物识别', example: false })
  biometricEnabled!: boolean;

  @ApiProperty({ description: '信任时间' })
  trustedAt!: Date;

  @ApiProperty({ description: '信任过期时间' })
  trustedUntil!: Date;

  @ApiProperty({ description: '最后活跃时间' })
  lastSeenAt!: Date;

  @ApiProperty({ description: '是否为当前会话', example: true })
  isCurrentSession!: boolean;
}

/**
 * 设备列表响应 DTO
 */
export class DeviceListResponseDto {
  @ApiProperty({ type: [DeviceResponseDto], description: '设备列表' })
  devices!: DeviceResponseDto[];
}

/**
 * 信任设备响应 DTO
 */
export class TrustDeviceResponseDto {
  @ApiProperty({ description: '设备ID', example: 'dev_abc123' })
  id!: string;

  @ApiProperty({ description: '设备名称', example: 'iPhone 15 Pro' })
  name!: string;

  @ApiProperty({ description: '信任过期时间' })
  trustedUntil!: Date;
}
