import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
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
import { TrustDeviceDto } from './dto/request.dto';

@ApiTags('设备管理')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DeviceService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取设备列表' })
  @ApiResultResponse(DeviceListResponseDto, '设备列表获取成功')
  getDeviceList(@CurrentAccount() account: JwtPayload) {
    return this.devicesService.getDeviceList(account.sub);
  }

  @Post()
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '注销可信设备' })
  @ApiParam({ name: 'id', description: '设备 ID' })
  @ApiResultNoContentResponse('设备已注销')
  untrustDevice(
    @CurrentAccount() account: JwtPayload,
    @Param('id') deviceId: string,
  ) {
    return this.devicesService.untrustDevice(account.sub, deviceId);
  }
}
