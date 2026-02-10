import {
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiResultNoContentResponse, ApiErrorResponses } from '@/core';
import { JwtAuthGuard } from '@/shared';
import type { JwtPayload } from '@/shared/interfaces/jwt-payload.interface';
import { AccountService } from '../services/account.service';

/**
 * 账户管理控制器
 * 处理已认证用户的账户操作
 */
@ApiTags('account')
@Controller('account')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取账户信息' })
  @ApiErrorResponses()
  getProfile(@Req() req: any) {
    const user = req.user as JwtPayload;
    return this.accountService.getAccountProfile(user.sub);
  }

  @Post('emergency-kit/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '确认 Emergency Kit 已下载' })
  @ApiResultNoContentResponse('确认成功')
  @ApiErrorResponses()
  async confirmEmergencyKit(@Req() req: any) {
    const user = req.user as JwtPayload;
    await this.accountService.confirmEmergencyKitDownload(user.sub);
  }

  @Post('delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除账户' })
  @ApiResultNoContentResponse('账户已删除')
  @ApiErrorResponses()
  async deleteAccount(@Req() req: any, @Ip() ip: string) {
    const user = req.user as JwtPayload;
    await this.accountService.deleteAccount(user.sub, ip);
  }
}
