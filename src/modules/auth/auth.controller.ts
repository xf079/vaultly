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
import {
  SendRegisterCodeDto,
  VerifyRegisterCodeDto,
  RegisterDto,
  LoginChallengeDto,
  LoginVerifyDto,
} from './dto/request.dto';
import {
  EmailAvailableResponseDto,
  SendRegisterCodeResponseDto,
  VerifyRegisterCodeResponseDto,
  LoginChallengeResponseDto,
  LoginVerifyResponseDto,
  SessionRefreshResponseDto,
} from './dto/response.dto';
import type { JwtPayload } from '@/shared/interfaces/jwt-payload.interface';

@ApiTags('授权与认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('email/available')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '检查邮箱可用性' })
  @ApiResultResponse(EmailAvailableResponseDto, '邮箱可用性检查成功')
  emailAvailable(@Query('email') email: string) {
    return this.authService.emailAvailable(email);
  }

  @Post('register/code')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @ApiOperation({ summary: '发送注册验证码' })
  @ApiResultResponse(SendRegisterCodeResponseDto, '注册验证码发送成功')
  registerCode(@Body() dto: SendRegisterCodeDto, @Ip() ip: string) {
    return this.authService.sendRegisterCode(dto, ip);
  }

  @Post('register/code/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '验证注册验证码' })
  @ApiResultResponse(VerifyRegisterCodeResponseDto, '注册验证码验证成功')
  registerCodeVerify(@Body() dto: VerifyRegisterCodeDto) {
    return this.authService.verifyRegisterCode(dto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: '提交注册' })
  @ApiResultNoContentResponse('注册成功')
  register(@Body() dto: RegisterDto, @Ip() ip: string) {
    return this.authService.register(dto, ip);
  }

  @Post('login/challenge')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '获取登录挑战（SRP 协议起点）' })
  @ApiResultResponse(LoginChallengeResponseDto, '获取登录挑战成功')
  loginChallenge(@Body() dto: LoginChallengeDto) {
    return this.authService.loginChallenge(dto);
  }

  @Post('login/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '验证登录（SRP + Secret Key 双因子认证）' })
  @ApiResultResponse(LoginVerifyResponseDto, '登录验证成功')
  loginVerify(@Body() dto: LoginVerifyDto, @Ip() ip: string) {
    return this.authService.loginVerify(dto, ip);
  }

  @Post('session/refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '刷新会话令牌' })
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
