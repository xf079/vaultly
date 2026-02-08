import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResultResponse, ApiErrorResponses } from '@/core';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  SendRegisterCodeDto,
  VerifyRegisterCodeDto,
  RegisterDto,
} from './dto/request.dto';
import {
  EmailAvailableResponseDto,
  SendRegisterCodeResponseDto,
  VerifyRegisterCodeResponseDto,
  RegisterResponseDto,
} from './dto/response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('email/available')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '检查邮箱可用性' })
  @ApiResultResponse(EmailAvailableResponseDto, '邮箱可用')
  emailAvailable(@Query('email') email: string) {
    return this.authService.emailAvailable(email);
  }

  @Post('register/code')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: '发送注册验证码' })
  @ApiResultResponse(SendRegisterCodeResponseDto, '注册验证码发送成功')
  registerCode(@Body() registerCodeDto: SendRegisterCodeDto) {
    return this.authService.sendRegisterCode(registerCodeDto);
  }

  @Post('register/code/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '验证注册验证码' })
  @ApiResultResponse(VerifyRegisterCodeResponseDto, '注册验证码验证成功')
  registerCodeVerify(@Body() registerCodeVerifyDto: VerifyRegisterCodeDto) {
    return this.authService.verifyRegisterCode(registerCodeVerifyDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '注册' })
  @ApiResultResponse(RegisterResponseDto, '注册成功')
  @ApiErrorResponses()
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login/challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取登录挑战' })
  @ApiResultResponse(LoginChallengeResponseDto, '获取登录挑战成功')
  @ApiErrorResponses()
  loginChallenge(@Body() loginChallengeDto: LoginChallengeDto) {
    return this.authService.loginChallenge(loginChallengeDto);
  }

  @Post('login/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '验证登录' })
  @ApiResultResponse(LoginVerifyResponseDto, '验证登录成功')
  @ApiErrorResponses()
  loginVerify(@Body() loginVerifyDto: LoginVerifyDto) {
    return this.authService.loginVerify(loginVerifyDto);
  }
}
