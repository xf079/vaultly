import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import Keyv from 'keyv';
import * as crypto from 'crypto';
import { KEYV_TOKEN } from '@/infrastructure/redis/redis.module';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { AccountStatus, AuditEventType } from '@/generated/prisma/enums';
import { AuditService } from '@/shared';

/**
 * 账户管理服务
 * 处理注册后的账户操作：密码重置、账户删除、Emergency Kit 下载确认等
 */
@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly mailerService: MailerService,
    @Inject(KEYV_TOKEN) private readonly redis: Keyv,
  ) {}

  /**
   * 发起密码重置
   * 发送重置验证码到邮箱
   */
  async initiatePasswordReset(email: string, ip: string) {
    const account = await this.prisma.account.findUnique({
      where: { email: email.toLowerCase() },
    });

    // 无论账户是否存在，都返回成功（防枚举）
    if (!account || account.status !== AccountStatus.ACTIVE) {
      return;
    }

    const code = crypto.randomInt(100000, 999999).toString();
    await this.redis.set(
      `auth:password-reset:code:${email.toLowerCase()}`,
      code,
      15 * 60 * 1000, // 15分钟
    );

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Vaultly 密码重置验证码',
        text: `您的验证码是：${code}，15 分钟内有效。如非本人操作请忽略。`,
      });
    } catch (err) {
      console.error('[AccountService] Password reset email failed:', err);
      console.log(`[DEV] Password reset code for ${email}: ${code}`);
    }

    // 审计日志
    await this.auditService.log({
      accountId: account.id,
      eventType: AuditEventType.PASSWORD_RESET_INITIATED,
      ipAddress: ip,
    });
  }

  /**
   * 完成密码重置
   * 更新 SRP 参数（零知识：服务端不接触明文密码）
   */
  async completePasswordReset(params: {
    email: string;
    code: string;
    passwordEncrypted: string;
    passwordSalt: string;
    srpSalt: string;
    srpVerifier: string;
    secretKeyFingerprint: string;
    kdfIterations: number;
    ip: string;
  }) {
    const email = params.email.toLowerCase();

    // 验证重置码
    const storedCode = await this.redis.get(
      `auth:password-reset:code:${email}`,
    );
    if (!storedCode || storedCode !== params.code) {
      throw new BadRequestException('验证码无效或已过期');
    }

    const account = await this.prisma.account.findUnique({
      where: { email },
    });
    if (!account || account.status !== AccountStatus.ACTIVE) {
      throw new NotFoundException('账户不存在');
    }

    // 更新 SRP 参数与 PBKDF2 密码哈希
    await this.prisma.account.update({
      where: { id: account.id },
      data: {
        passwordEncrypted: params.passwordEncrypted,
        passwordSalt: params.passwordSalt,
        srpSalt: params.srpSalt,
        srpVerifier: params.srpVerifier,
        secretKeyFingerprint: params.secretKeyFingerprint.toLowerCase(),
        kdfIterations: params.kdfIterations,
        lastPasswordChangeAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
        status: AccountStatus.ACTIVE,
      },
    });

    // 清理重置码
    await this.redis.delete(`auth:password-reset:code:${email}`);

    // 审计日志
    await this.auditService.log({
      accountId: account.id,
      eventType: AuditEventType.PASSWORD_RESET_COMPLETED,
      ipAddress: params.ip,
    });
  }

  /**
   * 获取账户基本信息（脱敏）
   */
  async getAccountProfile(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        email: true,
        status: true,
        emailVerifiedAt: true,
        lastPasswordChangeAt: true,
        kdfIterations: true,
        _count: {
          select: {
            devices: true,
            vaults: true,
          },
        },
        profile: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return account;
  }

  /**
   * 删除账户（软删除 → 更改状态为 SUSPENDED）
   */
  async deleteAccount(accountId: string, ip: string) {
    await this.prisma.account.update({
      where: { id: accountId },
      data: { status: AccountStatus.SUSPENDED },
    });

    await this.auditService.log({
      accountId,
      eventType: AuditEventType.ACCOUNT_DELETED,
      ipAddress: ip,
    });
  }
}
