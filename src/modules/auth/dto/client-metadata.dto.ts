import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Platform } from '@/generated/prisma/client';

/**
 * 客户端设备元数据 DTO
 * 用于注册和登录时收集客户端设备信息
 */
export class ClientMetadataDto {
  @IsEnum(Platform)
  @ApiProperty({
    enum: Platform,
    example: 'MACOS',
    description: '设备平台',
  })
  platform!: Platform;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiProperty({
    example: '15.3.2',
    description: '操作系统版本',
    required: false,
  })
  osVersion?: string;

  @IsString()
  @MaxLength(20)
  @ApiProperty({
    example: '1.0.0',
    description: '应用版本号',
  })
  appVersion!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({
    example: "Zhang's MacBook Pro",
    description: '设备名称',
    required: false,
  })
  deviceName?: string;
}
