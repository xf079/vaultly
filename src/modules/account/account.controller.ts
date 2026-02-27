import {
  Controller,
  Post,
  Get,
  Body,
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
import {
  AccountProfileResponseDto,
  EmergencyKitConfirmResponseDto,
  PasswordResetInitiatedResponseDto,
} from './dto/response.dto';
import {
  InitiatePasswordResetDto,
  CompletePasswordResetDto,
} from './dto/request.dto';

/**
 * 账户管理控制器
 * 处理已认证用户的账户操作
 */
@ApiTags('账户管理')
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取账户信息' })
  @ApiResultResponse(AccountProfileResponseDto, '账户信息')
  getProfile(@CurrentAccount() account: JwtPayload) {
    return this.accountService.getAccountProfile(account.sub);
  }

  @Post('delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除账户' })
  @ApiResultNoContentResponse('账户已删除')
  async deleteAccount(@CurrentAccount() account: JwtPayload, @Ip() ip: string) {
    await this.accountService.deleteAccount(account.sub, ip);
  }

  @Post('password-reset/initiate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '发起密码重置（发送验证码）' })
  @ApiResultResponse(PasswordResetInitiatedResponseDto, '验证码已发送')
  async initiatePasswordReset(
    @Body() dto: InitiatePasswordResetDto,
    @Ip() ip: string,
  ) {
    await this.accountService.initiatePasswordReset(dto.email, ip);
    return { message: '如果邮箱存在，验证码已发送' };
  }

  @Post('password-reset/complete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '完成密码重置' })
  @ApiResultNoContentResponse('密码重置成功')
  async completePasswordReset(
    @Body() dto: CompletePasswordResetDto,
    @Ip() ip: string,
  ) {
    await this.accountService.completePasswordReset({
      email: dto.email,
      code: dto.code,
      srpSalt: dto.srpSalt,
      srpVerifier: dto.srpVerifier,
      secretKeyFingerprint: dto.secretKeyFingerprint,
      kdfIterations: dto.kdfIterations,
      ip,
    });
  }
}
