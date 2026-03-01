import {
  Controller,
  Get,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiResultNoContentResponse, ApiResultResponse } from '@/core';
import { CurrentAccount, JwtAuthGuard } from '@/shared';
import type { JwtPayload } from '@/shared/interfaces/jwt-payload.interface';
import { AccountService } from './account.service';
import { AccountProfileResponseDto } from './dto/response.dto';

/**
 * 账户管理控制器
 * 处理已认证用户的账户操作（查询、删除等）
 * 密码重置（无需登录态）已移至 /auth/password-reset/*
 */
@ApiTags('账户管理')
@Controller('account')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取账户信息' })
  @ApiResultResponse(AccountProfileResponseDto, '账户信息')
  getProfile(@CurrentAccount() account: JwtPayload) {
    return this.accountService.getAccountProfile(account.sub);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '删除账户',
    description: '软删除：将账户状态置为 SUSPENDED，数据保留用于审计。',
  })
  @ApiResultNoContentResponse('账户已删除')
  async deleteAccount(@CurrentAccount() account: JwtPayload, @Ip() ip: string) {
    await this.accountService.deleteAccount(account.sub, ip);
  }
}
