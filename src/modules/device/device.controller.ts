import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiResultCreatedResponse,
  ApiResultNoContentResponse,
  ApiResultResponse,
} from '@/core';
import { CurrentAccount, JwtAuthGuard, type JwtPayload } from '@/shared';
import { DeviceService } from './device.service';
import {
  DeviceListResponseDto,
  TrustDeviceResponseDto,
} from './dto/response.dto';
import { TrustDeviceDto, UntrustDeviceDto } from './dto/request.dto';

@ApiTags('设备管理')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DeviceService) {}

  @Post('list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取设备列表' })
  @ApiResultResponse(DeviceListResponseDto, '设备列表获取成功')
  getDeviceList(@CurrentAccount() account: JwtPayload) {
    return this.devicesService.getDeviceList(account.sub);
  }

  @Post('trust')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '注册可信设备（登录后调用）' })
  @ApiResultCreatedResponse(TrustDeviceResponseDto, '设备信任注册成功')
  trustDevice(
    @CurrentAccount() account: JwtPayload,
    @Body() dto: TrustDeviceDto,
  ) {
    return this.devicesService.trustDevice(
      account.sub,
      dto.deviceFingerprint,
      dto,
    );
  }

  @Post('untrust')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '注销可信设备' })
  @ApiResultNoContentResponse('设备已注销')
  untrustDevice(
    @CurrentAccount() account: JwtPayload,
    @Body() dto: UntrustDeviceDto,
  ) {
    return this.devicesService.untrustDevice(
      account.sub,
      dto.deviceFingerprint,
    );
  }
}
