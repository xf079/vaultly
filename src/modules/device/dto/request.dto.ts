import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClientMetadataDto } from '@/modules/auth/dto/client-metadata.dto';

/**
 * 注册可信设备请求 DTO
 */
export class TrustDeviceDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(64)
  @MaxLength(64)
  @ApiProperty({
    example: 'sha256:abc123...',
    description: '设备指纹（64字符）',
  })
  deviceFingerprint!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @ApiProperty({
    example: 'iPhone 15 Pro',
    description: '设备名称',
  })
  deviceName!: string;

  @ValidateNested()
  @Type(() => ClientMetadataDto)
  @ApiProperty({
    type: ClientMetadataDto,
    description: '客户端设备元数据',
  })
  clientMetadata!: ClientMetadataDto;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    example: false,
    description: '是否启用生物识别',
    required: false,
  })
  biometricEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiProperty({
    example: 'fcm:abc123...',
    description: '推送通知令牌',
    required: false,
  })
  pushToken?: string;
}
