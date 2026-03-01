import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  UseGuards,
  Req,
  Ip,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiResultResponse, ApiResultNoContentResponse } from '@/core';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/shared';
import { AuthService } from './services/auth.service';
import { AccountService } from '../account/account.service';
import {
  SendRegisterCodeDto,
  VerifyRegisterCodeDto,
  RegisterDto,
  LoginChallengeDto,
  LoginVerifyDto,
  LoginPasswordDto,
} from './dto/request.dto';
import {
  InitiatePasswordResetDto,
  CompletePasswordResetDto,
} from '../account/dto/request.dto';
import {
  EmailAvailableResponseDto,
  SendRegisterCodeResponseDto,
  VerifyRegisterCodeResponseDto,
  LoginChallengeResponseDto,
  LoginResponseDto,
  PasswordResetCodeResponseDto,
  SessionRefreshResponseDto,
} from './dto/response.dto';
import type { JwtPayload } from '@/shared/interfaces/jwt-payload.interface';

@ApiTags('授权与认证')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly accountService: AccountService,
  ) {}

  // ─── 邮箱检查 ────────────────────────────────────────────

  @Get('email/available')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '检查邮箱可用性' })
  @ApiResultResponse(EmailAvailableResponseDto, '邮箱可用性检查成功')
  emailAvailable(@Query('email') email: string) {
    return this.authService.emailAvailable(email);
  }

  // ─── 注册流程 ─────────────────────────────────────────────

  @Post('register/code')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @ApiOperation({
    summary: '发送注册验证码',
    description: '每小时最多 3 次；验证码 10 分钟有效。',
  })
  @ApiResultResponse(SendRegisterCodeResponseDto, '验证码已发送')
  registerCode(@Body() dto: SendRegisterCodeDto, @Ip() ip: string) {
    return this.authService.sendRegisterCode(dto, ip);
  }

  @Post('register/code/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: '验证注册验证码',
    description:
      '验证通过后返回 verificationToken，有效期 5 分钟，用于下一步提交注册。',
  })
  @ApiResultResponse(VerifyRegisterCodeResponseDto, '验证码验证成功')
  registerCodeVerify(@Body() dto: VerifyRegisterCodeDto) {
    return this.authService.verifyRegisterCode(dto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({
    summary: '完成注册',
    description:
      '提交加密凭据（SRP 参数、Secret Key 指纹、PBKDF2 哈希等）创建账户，注册设备自动信任。',
  })
  @ApiResultNoContentResponse('注册成功')
  register(@Body() dto: RegisterDto, @Ip() ip: string) {
    return this.authService.register(dto, ip);
  }

  // ─── 登录流程 ─────────────────────────────────────────────

  @Post('login/challenge')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: '获取登录挑战参数',
    description: [
      '传入邮箱（和可选设备指纹），返回：',
      '- SRP 参数（srpSalt、srpB）供 SRP 流使用',
      '- passwordSalt 供密码流客户端本地 PBKDF2 预哈希',
      '- requiresSecretKey：true 表示新/未信任设备，需提供 Secret Key',
    ].join('\n'),
  })
  @ApiResultResponse(LoginChallengeResponseDto, '登录挑战成功')
  loginChallenge(@Body() dto: LoginChallengeDto) {
    return this.authService.loginChallenge(dto);
  }

  @Post('login/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'SRP 登录验证',
    description: [
      '通过 SRP 协议完成零知识登录：',
      '- 信任设备：提交 srpA + srpM1，无需 secretKeyFingerprint',
      '- 新/未信任设备：还需同时提交 secretKeyFingerprint',
    ].join('\n'),
  })
  @ApiResultResponse(LoginResponseDto, 'SRP 登录成功')
  loginVerify(@Body() dto: LoginVerifyDto, @Ip() ip: string) {
    return this.authService.loginVerify(dto, ip);
  }

  @Post('login/password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: '邮箱+密码登录',
    description: [
      '通过密码完成登录（PBKDF2 校验）：',
      '- 信任设备：仅需邮箱+密码+设备指纹',
      '- 新/未信任设备：还需同时提交 secretKeyFingerprint',
    ].join('\n'),
  })
  @ApiResultResponse(LoginResponseDto, '密码登录成功')
  loginWithPassword(@Body() dto: LoginPasswordDto, @Ip() ip: string) {
    return this.authService.loginWithPassword(dto, ip);
  }

  // ─── 密码重置流程 ─────────────────────────────────────────

  @Post('password-reset/code')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  @ApiOperation({
    summary: '发送密码重置验证码',
    description:
      '无论邮箱是否存在均返回相同提示，防枚举攻击；验证码 15 分钟有效。',
  })
  @ApiResultResponse(PasswordResetCodeResponseDto, '验证码已发送（如邮箱存在）')
  async passwordResetCode(
    @Body() dto: InitiatePasswordResetDto,
    @Ip() ip: string,
  ) {
    await this.accountService.initiatePasswordReset(dto.email, ip);
    return { message: '如果邮箱存在，验证码已发送' };
  }

  @Post('password-reset/complete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @ApiOperation({
    summary: '完成密码重置',
    description:
      '提交验证码与新的加密凭据（SRP 参数、PBKDF2 哈希等）完成密码重置。',
  })
  @ApiResultNoContentResponse('密码重置成功')
  async passwordResetComplete(
    @Body() dto: CompletePasswordResetDto,
    @Ip() ip: string,
  ) {
    await this.accountService.completePasswordReset({
      email: dto.email,
      code: dto.code,
      passwordEncrypted: dto.passwordEncrypted,
      passwordSalt: dto.passwordSalt,
      srpSalt: dto.srpSalt,
      srpVerifier: dto.srpVerifier,
      secretKeyFingerprint: dto.secretKeyFingerprint,
      kdfIterations: dto.kdfIterations,
      ip,
    });
  }

  // ─── 会话管理 ─────────────────────────────────────────────

  @Post('session/refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '刷新会话令牌',
    description:
      '吊销旧 token 并签发新 token，旧 token 在剩余有效期内加入吊销名单。',
  })
  @ApiResultResponse(SessionRefreshResponseDto, '会话刷新成功')
  sessionRefresh(@Req() req: any, @Ip() ip: string) {
    const user = req.user as JwtPayload;
    return this.authService.sessionRefresh(user.sub, user.jti!, user.exp!, ip);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '主动注销' })
  @ApiResultNoContentResponse('注销成功')
  async logout(@Req() req: any, @Ip() ip: string) {
    const user = req.user as JwtPayload;
    await this.authService.logout(user.sub, user.jti!, user.exp!, ip);
  }
}
