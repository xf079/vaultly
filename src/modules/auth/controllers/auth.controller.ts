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
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiResultResponse,
  ApiResultCreatedResponse,
  ApiResultNoContentResponse,
} from '@/core';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/shared';
import { AuthService } from '../services/auth.service';
import {
  SendRegisterCodeDto,
  VerifyRegisterCodeDto,
  RegisterDto,
  LoginChallengeDto,
  LoginVerifyDto,
  TrustDeviceDto,
} from '../dto/request.dto';
import {
  EmailAvailableResponseDto,
  SendRegisterCodeResponseDto,
  VerifyRegisterCodeResponseDto,
  RegisterResponseDto,
  LoginChallengeResponseDto,
  LoginVerifyResponseDto,
  TrustDeviceResponseDto,
  SessionRefreshResponseDto,
} from '../dto/response.dto';
import type { JwtPayload } from '@/shared/interfaces/jwt-payload.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── 接口1：检查邮箱可用性 ─────────────────────────────

  @Get('email/available')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '检查邮箱可用性' })
  @ApiResultResponse(EmailAvailableResponseDto, '邮箱可用性检查成功')
  emailAvailable(@Query('email') email: string) {
    return this.authService.emailAvailable(email);
  }

  // ─── 接口2：发送注册验证码 ─────────────────────────────

  @Post('register/code')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @ApiOperation({ summary: '发送注册验证码' })
  @ApiResultResponse(SendRegisterCodeResponseDto, '注册验证码发送成功')
  registerCode(@Body() dto: SendRegisterCodeDto) {
    return this.authService.sendRegisterCode(dto);
  }

  // ─── 接口3：验证注册验证码 ─────────────────────────────

  @Post('register/code/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '验证注册验证码' })
  @ApiResultResponse(VerifyRegisterCodeResponseDto, '注册验证码验证成功')
  registerCodeVerify(@Body() dto: VerifyRegisterCodeDto) {
    return this.authService.verifyRegisterCode(dto);
  }

  // ─── 接口4：提交注册（零知识核心） ────────────────────

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: '提交注册（创建零知识账户）' })
  @ApiResultCreatedResponse(RegisterResponseDto, '注册成功')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ─── 接口5：获取登录挑战（SRP起点） ───────────────────

  @Post('login/challenge')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '获取登录挑战（SRP 协议起点）' })
  @ApiResultResponse(LoginChallengeResponseDto, '获取登录挑战成功')
  loginChallenge(@Body() dto: LoginChallengeDto) {
    return this.authService.loginChallenge(dto);
  }

  // ─── 接口6：验证登录（SRP + Secret Key 双因子） ───────

  @Post('login/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '验证登录（SRP + Secret Key 双因子认证）' })
  @ApiResultResponse(LoginVerifyResponseDto, '登录验证成功')
  loginVerify(@Body() dto: LoginVerifyDto) {
    return this.authService.loginVerify(dto);
  }

  // ─── 接口7：注册可信设备 ──────────────────────────────

  @Post('devices/trust')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '注册可信设备（登录后必调）' })
  @ApiResultCreatedResponse(TrustDeviceResponseDto, '设备信任注册成功')
  trustDevice(@Body() dto: TrustDeviceDto, @Req() req: any) {
    const user = req.user as JwtPayload;
    return this.authService.trustDevice(user.sub, dto.deviceFingerprint, dto);
  }

  // ─── 接口8：刷新会话 ─────────────────────────────────

  @Post('session/refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '刷新会话令牌' })
  @ApiResultResponse(SessionRefreshResponseDto, '会话刷新成功')
  sessionRefresh(@Req() req: any) {
    const user = req.user as JwtPayload;
    return this.authService.sessionRefresh(user.sub, user.jti!, user.exp!);
  }

  // ─── 接口9：主动注销 ─────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '主动注销' })
  @ApiResultNoContentResponse('注销成功')
  async logout(@Req() req: any) {
    const user = req.user as JwtPayload;
    await this.authService.logout(user.sub, user.jti!, user.exp!);
  }
}
