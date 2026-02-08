import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { SendRegisterCodeDto, VerifyRegisterCodeDto } from './dto/request.dto';
import { AccountStatus } from '@/generated/prisma/enums';
import {
  SendRegisterCodeResponseDto,
  VerifyRegisterCodeResponseDto,
} from './dto/response.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 检查邮箱是否可用
   * @param email 邮箱
   * @returns 邮箱是否可用
   */
  async emailAvailable(email: string) {
    /**
     * 检查邮箱是否存在
     */
    const account = await this.prisma.account.findUnique({
      where: { email, status: AccountStatus.ACTIVE },
    });
    return { available: !account };
  }

  /**
   * 发送注册验证码
   * @param data 发送注册验证码请求DTO
   * @returns 发送注册验证码结果
   */
  async sendRegisterCode(
    data: SendRegisterCodeDto,
  ): Promise<SendRegisterCodeResponseDto> {
    const { email, client_fingerprint, captcha_token } = data;
    /**
     * 检查邮箱是否存在
     */
    const account = await this.prisma.account.findUnique({
      where: { email, status: AccountStatus.ACTIVE },
    });
    if (!account) {
      throw new BadRequestException('邮箱不存在');
    }
    /**
     * 检查客户端指纹是否存在
     */
    const device = await this.prisma.device.findUnique({
      where: { fingerprint: client_fingerprint },
    });
    if (!device) {
      throw new BadRequestException('客户端指纹不存在');
    }
    /**
     * 检查验证码是否超过最大尝试次数
     */
    const rateLimitCounter = await this.prisma.rateLimitCounter.findFirst({
      where: {
        key: `auth:register:code:${email}:${client_fingerprint}:${captcha_token}`,
        attempts: {
          gte: 3,
        },
      },
    });
    if (rateLimitCounter) {
      throw new BadRequestException('验证码超过最大尝试次数');
    }
    /**
     * 发送验证码
     */
    const verificationToken = await this.prisma.sessionRevocation.create({
      data: {
        accountId: account.id,
        expiresAt: new Date(Date.now() + 600000),
      },
    });
    if (!verificationToken) {
      throw new BadRequestException('发送验证码失败');
    }
    /**
     * 检查验证码是否正确
     */
    const rateLimitCounter = await this.prisma.rateLimitCounter.findUnique({
      where: {
        key: `auth:register:code:${email}:${client_fingerprint}:${captcha_token}`,
      },
    });
    if (!rateLimitCounter) {
      throw new BadRequestException('验证码不存在');
    }
    return {
      verificationToken: 'vrt_7a3b9c1d2e5f8a0b',
      expiresIn: 600,
    };
  }

  /**
   * 验证注册验证码
   * @param data 验证注册验证码请求DTO
   * @returns 验证注册验证码结果
   */
  async verifyRegisterCode(
    data: VerifyRegisterCodeDto,
  ): Promise<VerifyRegisterCodeResponseDto> {
    const { email, code } = data;
    /**
     * 检查邮箱是否存在
     */
    const account = await this.prisma.account.findUnique({
      where: { email, status: AccountStatus.ACTIVE },
    });
    if (!account) {
      throw new BadRequestException('邮箱不存在');
    }
    /**
     * 检查验证码是否存在
     */
    const rateLimitCounter = await this.prisma.rateLimitCounter.findUnique({
      where: { key: `auth:register:code:${email}:${code}` },
    });
    if (!rateLimitCounter) {
      throw new BadRequestException('验证码不存在');
    }
    /**
     * 检查验证码是否超过最大尝试次数
     */
    if (rateLimitCounter.attempts >= 3) {
      throw new BadRequestException('验证码错误');
    }
    return {
      verificationToken: rateLimitCounter.id,
      expiresIn: rateLimitCounter.resetAt.getTime() - Date.now(),
    };
  }
}
