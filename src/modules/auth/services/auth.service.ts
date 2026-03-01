import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import Keyv from 'keyv';
import * as crypto from 'crypto';
import { KEYV_TOKEN } from '@/infrastructure/redis/redis.module';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { AccountStatus, AuditEventType } from '@/generated/prisma/enums';
import { SrpService } from './srp.service';
import { DeviceService } from '../../device/device.service';
import { AuditService } from '@/shared/services/audit.service';
import {
  SendRegisterCodeDto,
  VerifyRegisterCodeDto,
  RegisterDto,
  LoginPasswordDto,
  LoginChallengeDto,
  LoginVerifyDto,
} from '../dto/request.dto';
import {
  SendRegisterCodeResponseDto,
  VerifyRegisterCodeResponseDto,
  LoginChallengeResponseDto,
  LoginResponseDto,
  SessionRefreshResponseDto,
} from '../dto/response.dto';
import type { JwtPayload } from '@/shared/interfaces/jwt-payload.interface';
import { MailerService } from '@nestjs-modules/mailer';
import { maskEmail } from '@/utils/util';
import { verifyPassword } from '@/utils/pbkdf2.util';

/** 验证码有效期：10分钟 */
const CODE_TTL_MS = 10 * 60 * 1000;
/** Verification Token 有效期：5分钟 */
const VRT_TTL_MS = 5 * 60 * 1000;
/** SRP 挑战缓存有效期：5分钟 */
const SRP_CHALLENGE_TTL_MS = 5 * 60 * 1000;
/** 最大登录失败次数 */
const MAX_FAILED_ATTEMPTS = 5;
/** 临时锁定时间：15分钟 */
const LOCK_DURATION_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly srpService: SrpService,
    private readonly deviceService: DeviceService,
    private readonly auditService: AuditService,
    private readonly mailerService: MailerService,
    @Inject(KEYV_TOKEN) private readonly redis: Keyv,
  ) {}

  /**
   * 检查邮箱是否可用
   * 安全考虑：模糊响应，防枚举攻击
   */
  async emailAvailable(email: string) {
    const account = await this.prisma.account.findUnique({
      where: { email: email.toLowerCase() },
    });
    return { available: !account || account.status !== AccountStatus.ACTIVE };
  }

  /**
   * 发送注册验证码
   * @param data 发送注册验证码请求数据
   * @param ip 请求 IP
   * @returns 发送注册验证码响应数据
   */
  async sendRegisterCode(
    data: SendRegisterCodeDto,
    ip: string,
  ): Promise<SendRegisterCodeResponseDto> {
    void ip;
    const email = data.email.toLowerCase();

    // 检查邮箱是否已被注册
    const account = await this.prisma.account.findFirst({
      where: { email, status: AccountStatus.ACTIVE },
    });
    if (account) {
      throw new BadRequestException('该邮箱已被注册');
    }

    // 生成 6 位数字验证码
    const code = crypto.randomInt(100000, 999999).toString();
    await this.redis.set(`auth:register:code:${email}`, code, CODE_TTL_MS);

    await this.mailerService.sendMail({
      to: email,
      subject: '注册验证码',
      text: `您的注册验证码是：${code}，10 分钟内有效。如非本人操作请忽略。`,
    });

    return {
      expiresIn: CODE_TTL_MS / 1000,
      maskedEmail: maskEmail(email),
    };
  }

  /**
   * 验证注册验证码
   * @param data 验证注册验证码请求数据
   * @returns 验证注册验证码响应数据
   */
  async verifyRegisterCode(
    data: VerifyRegisterCodeDto,
  ): Promise<VerifyRegisterCodeResponseDto> {
    const email = data.email.toLowerCase();

    // 注册场景：邮箱应当尚未被注册
    const account = await this.prisma.account.findUnique({
      where: { email },
    });
    if (account && account.status === AccountStatus.ACTIVE) {
      throw new BadRequestException('该邮箱已被注册');
    }

    // 从 Redis 校验验证码
    const storedCode = await this.redis.get(`auth:register:code:${email}`);
    if (!storedCode || storedCode !== data.code) {
      throw new BadRequestException('验证码无效或已过期');
    }

    // 验证通过：删除验证码，生成 verification token
    await this.redis.delete(`auth:register:code:${email}`);

    const verificationToken = `vrt_${crypto.randomUUID()}`;
    await this.redis.set(
      `auth:register:vrt:${verificationToken}`,
      email,
      VRT_TTL_MS,
    );

    return {
      verificationToken,
      expiresIn: VRT_TTL_MS / 1000,
    };
  }

  /**
   * 完成注册，创建零知识账户
   * 服务端仅存储 SRP salt、verifier 和 Secret Key 指纹，永不接触明文密码
   * @param data 注册请求数据
   * @param ip 请求 IP
   */
  async register(data: RegisterDto, ip: string) {
    const email = data.email.toLowerCase();

    // 1. 验证 verification token
    const tokenEmail = await this.redis.get(
      `auth:register:vrt:${data.verificationToken}`,
    );
    if (!tokenEmail || tokenEmail !== email) {
      throw new BadRequestException('验证令牌无效或已过期');
    }

    // 2. 检查邮箱是否已被注册（防并发）
    const existing = await this.prisma.account.findUnique({
      where: { email },
      select: { id: true, status: true },
    });
    if (existing && existing.status === AccountStatus.ACTIVE) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 3. 创建账户（事务）
    const deviceFingerprint = crypto.randomBytes(32).toString('hex');
    const account = await this.prisma.$transaction(async (tx) => {
      // 如果有旧的非活跃记录，先删除
      if (existing) {
        await tx.account.delete({ where: { id: existing.id } });
      }

      const newAccount = await tx.account.create({
        data: {
          email,
          passwordEncrypted: data.passwordEncrypted,
          passwordSalt: data.passwordSalt,
          srpSalt: data.srpSalt,
          srpVerifier: data.srpVerifier,
          secretKeyFingerprint: data.secretKeyFingerprint.toLowerCase(),
          kdfIterations: data.kdfIterations,
          emailVerifiedAt: new Date(),
          status: AccountStatus.ACTIVE,
        },
      });

      // 创建首个可信设备（自动信任注册设备）
      await tx.device.create({
        data: {
          accountId: newAccount.id,
          fingerprint: deviceFingerprint,
          name:
            data.clientMetadata.deviceName ??
            `${data.clientMetadata.platform} Device`,
          platform: data.clientMetadata.platform,
          osVersion: data.clientMetadata.osVersion,
          appVersion: data.clientMetadata.appVersion,
          trustedAt: new Date(),
          trustedUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          lastSeenAt: new Date(),
          isCurrentSession: true,
        },
      });

      return newAccount;
    });

    // 5. 清理 verification token
    await this.redis.delete(`auth:register:vrt:${data.verificationToken}`);

    // 6. 审计日志
    await this.auditService.log({
      accountId: account.id,
      eventType: AuditEventType.ACCOUNT_CREATED,
      ipAddress: ip,
      metadata: {
        platform: data.clientMetadata.platform,
        appVersion: data.clientMetadata.appVersion,
      },
    });
  }

  /**
   * 邮箱 + 密码登录
   * 信任设备：邮箱+密码即可；新/未信任设备：还需传 secretKeyFingerprint 并校验
   */
  async loginWithPassword(
    data: LoginPasswordDto,
    ip: string,
  ): Promise<LoginResponseDto> {
    const email = data.email.toLowerCase();

    const account = await this.prisma.account.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordEncrypted: true,
        passwordSalt: true,
        kdfIterations: true,
        secretKeyFingerprint: true,
        status: true,
        lockedUntil: true,
      },
    });

    if (!account) {
      await this.randomDelay(500, 1000);
      throw new NotFoundException('账户不存在');
    }

    if (this.isAccountLocked(account)) {
      const retryAfter = account.lockedUntil
        ? Math.ceil((account.lockedUntil.getTime() - Date.now()) / 1000)
        : 0;
      throw new ForbiddenException(
        `账户已被临时锁定，请 ${retryAfter} 秒后重试`,
      );
    }

    const isTrusted = await this.deviceService.isTrusted(
      account.id,
      data.deviceFingerprint,
    );

    // 新/未信任设备必须提供并校验 Secret Key
    if (!isTrusted) {
      if (!data.secretKeyFingerprint) {
        throw new BadRequestException(
          '新设备或未信任设备登录需提供 Secret Key 指纹',
        );
      }
      if (
        !crypto.timingSafeEqual(
          Buffer.from(data.secretKeyFingerprint.toLowerCase()),
          Buffer.from(account.secretKeyFingerprint),
        )
      ) {
        await this.handleFailedLogin(
          account.id,
          account.email,
          AuditEventType.SECRET_KEY_VERIFICATION_FAILED,
          data.deviceFingerprint,
          ip,
        );
        throw new ForbiddenException('Secret Key 验证失败');
      }
    }

    if (
      !verifyPassword(
        data.password,
        account.passwordSalt,
        account.kdfIterations,
        account.passwordEncrypted,
      )
    ) {
      await this.handleFailedLogin(
        account.id,
        account.email,
        AuditEventType.LOGIN_FAILED,
        data.deviceFingerprint,
        ip,
      );
      throw new UnauthorizedException('密码错误');
    }

    await this.prisma.account.update({
      where: { id: account.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    if (isTrusted) {
      const device = await this.deviceService.findTrustedDevice(
        account.id,
        data.deviceFingerprint,
      );
      if (device) {
        await this.deviceService.resetCurrentSessions(account.id);
        await this.deviceService.setCurrentSession(device.id);
        await this.deviceService.updateLastSeen(device.id);
      }
    }

    const jti = crypto.randomUUID();
    const expiresIn = this.configService.get<string>('jwt.expiresIn', '7d');
    const payload: JwtPayload = {
      sub: account.id,
      email: account.email,
      jti,
    };
    const sessionToken = this.jwtService.sign(payload);

    await this.redis.set(
      `auth:session:${jti}`,
      JSON.stringify({
        accountId: account.id,
        deviceFingerprint: data.deviceFingerprint,
      }),
      this.parseExpiresIn(expiresIn),
    );

    await this.auditService.log({
      accountId: account.id,
      eventType: AuditEventType.LOGIN_SUCCESS,
      ipAddress: ip,
      metadata: {
        deviceFingerprint: data.deviceFingerprint.slice(-6),
        isNewDevice: !isTrusted,
        platform: data.clientMetadata.platform,
        loginMethod: 'password',
      },
    });

    return {
      sessionToken,
      expiresIn: this.parseExpiresIn(expiresIn) / 1000,
      isNewDevice: !isTrusted,
      nextStep: isTrusted ? 'sync_vaults' : 'register_device',
    };
  }

  /**
   * 登录挑战：返回 SRP 参数与是否需要 Secret Key
   * 客户端用 SRP 计算后调用 login/verify，或改用 login/password
   */
  async loginChallenge(
    data: LoginChallengeDto,
  ): Promise<LoginChallengeResponseDto> {
    const email = data.email.toLowerCase();

    const account = await this.prisma.account.findUnique({
      where: { email },
      select: {
        id: true,
        srpSalt: true,
        srpVerifier: true,
        secretKeyFingerprint: true,
        kdfIterations: true,
        passwordSalt: true,
        status: true,
        lockedUntil: true,
      },
    });

    if (!account) {
      await this.randomDelay(500, 1000);
      throw new NotFoundException('账户不存在');
    }

    if (this.isAccountLocked(account)) {
      const retryAfter = account.lockedUntil
        ? Math.ceil((account.lockedUntil.getTime() - Date.now()) / 1000)
        : 0;
      throw new ForbiddenException(
        `账户已被临时锁定，请 ${retryAfter} 秒后重试`,
      );
    }

    const { b, B } = this.srpService.generateServerKeyPair(account.srpVerifier);
    await this.redis.set(
      `auth:srp:challenge:${account.id}`,
      JSON.stringify({ b, B }),
      SRP_CHALLENGE_TTL_MS,
    );

    const requiresSecretKey = data.deviceFingerprint
      ? !(await this.deviceService.isTrusted(
          account.id,
          data.deviceFingerprint,
        ))
      : true;

    return {
      srpSalt: account.srpSalt,
      srpB: B,
      secretKeyFingerprint: account.secretKeyFingerprint,
      kdfIterations: account.kdfIterations,
      passwordSalt: account.passwordSalt,
      accountUuid: account.id,
      requiresSecretKey,
    };
  }

  /**
   * SRP 登录验证：校验 M1、可选校验 Secret Key（新设备必校验），签发 JWT
   */
  async loginVerify(
    data: LoginVerifyDto,
    ip: string,
  ): Promise<LoginResponseDto> {
    const account = await this.prisma.account.findUnique({
      where: { id: data.accountUuid },
    });
    if (!account) {
      throw new NotFoundException('账户不存在');
    }

    if (this.isAccountLocked(account)) {
      throw new ForbiddenException('账户已被临时锁定');
    }

    const isNewDevice = !(await this.deviceService.isTrusted(
      account.id,
      data.deviceFingerprint,
    ));

    if (isNewDevice) {
      if (!data.secretKeyFingerprint) {
        throw new BadRequestException('新设备登录需提供 Secret Key 指纹');
      }
      if (
        !crypto.timingSafeEqual(
          Buffer.from(data.secretKeyFingerprint.toLowerCase()),
          Buffer.from(account.secretKeyFingerprint),
        )
      ) {
        await this.handleFailedLogin(
          account.id,
          account.email,
          AuditEventType.SECRET_KEY_VERIFICATION_FAILED,
          data.deviceFingerprint,
          ip,
        );
        throw new ForbiddenException('Secret Key 验证失败');
      }
    }

    const challengeStr = await this.redis.get(
      `auth:srp:challenge:${account.id}`,
    );
    if (!challengeStr) {
      throw new BadRequestException('登录挑战已过期，请重新获取');
    }
    const challenge = JSON.parse(challengeStr as string);

    const srpResult = this.srpService.verifyClient({
      srpA: data.srpA,
      srpB: challenge.B,
      srpb: challenge.b,
      srpM1: data.srpM1,
      verifier: account.srpVerifier,
    });

    if (!srpResult.valid) {
      await this.handleFailedLogin(
        account.id,
        account.email,
        AuditEventType.SRP_VERIFICATION_FAILED,
        data.deviceFingerprint,
        ip,
      );
      throw new UnauthorizedException('SRP 验证失败');
    }

    await this.redis.delete(`auth:srp:challenge:${account.id}`);
    await this.prisma.account.update({
      where: { id: account.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    if (!isNewDevice) {
      const device = await this.deviceService.findTrustedDevice(
        account.id,
        data.deviceFingerprint,
      );
      if (device) {
        await this.deviceService.resetCurrentSessions(account.id);
        await this.deviceService.setCurrentSession(device.id);
        await this.deviceService.updateLastSeen(device.id);
      }
    }

    const jti = crypto.randomUUID();
    const expiresIn = this.configService.get<string>('jwt.expiresIn', '7d');
    const payload: JwtPayload = {
      sub: account.id,
      email: account.email,
      jti,
    };
    const sessionToken = this.jwtService.sign(payload);

    await this.redis.set(
      `auth:session:${jti}`,
      JSON.stringify({
        accountId: account.id,
        deviceFingerprint: data.deviceFingerprint,
      }),
      this.parseExpiresIn(expiresIn),
    );

    await this.auditService.log({
      accountId: account.id,
      eventType: AuditEventType.LOGIN_SUCCESS,
      ipAddress: ip,
      metadata: {
        deviceFingerprint: data.deviceFingerprint.slice(-6),
        isNewDevice,
        platform: data.clientMetadata.platform,
        loginMethod: 'srp',
      },
    });

    return {
      sessionToken,
      expiresIn: this.parseExpiresIn(expiresIn) / 1000,
      isNewDevice,
      nextStep: isNewDevice ? 'register_device' : 'sync_vaults',
    };
  }

  /**
   * 刷新会话令牌
   * 验证旧 token 有效性，签发新 token，将旧 token 加入吊销列表
   * @param accountId 账户 ID
   * @param jti 令牌 JTI
   * @param exp 令牌过期时间
   * @param ip 请求 IP
   * @returns 刷新会话令牌响应数据
   */
  async sessionRefresh(
    accountId: string,
    jti: string,
    exp: number,
    ip: string,
  ): Promise<SessionRefreshResponseDto> {
    // 检查旧 token 是否已被吊销
    const isRevoked = await this.redis.get(`auth:revoked:${jti}`);
    if (isRevoked) {
      throw new UnauthorizedException('会话已被吊销');
    }

    // 吊销旧 token
    const remainingTtl = Math.max(0, exp * 1000 - Date.now());
    await this.redis.set(`auth:revoked:${jti}`, true, remainingTtl);

    // 签发新 token
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account || account.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException('账户不可用');
    }

    const newJti = crypto.randomUUID();
    const expiresIn = this.configService.get<string>('jwt.expiresIn', '7d');
    const payload: JwtPayload = {
      sub: account.id,
      email: account.email,
      jti: newJti,
    };
    const sessionToken = this.jwtService.sign(payload);

    await this.auditService.log({
      accountId,
      eventType: AuditEventType.SESSION_REFRESHED,
      ipAddress: ip,
    });

    return {
      sessionToken,
      expiresIn: this.parseExpiresIn(expiresIn) / 1000,
    };
  }

  /**
   * 主动注销，将当前 token 加入吊销列表
   * @param accountId 账户 ID
   * @param jti 令牌 JTI
   * @param exp 令牌过期时间
   * @param ip 请求 IP
   */
  async logout(
    accountId: string,
    jti: string,
    exp: number,
    ip: string,
  ): Promise<void> {
    // 1. 将 token 加入吊销列表
    const remainingTtl = Math.max(0, exp * 1000 - Date.now());
    await this.redis.set(`auth:revoked:${jti}`, true, remainingTtl);

    // 2. 审计日志
    await this.auditService.log({
      accountId,
      eventType: AuditEventType.LOGOUT,
      ipAddress: ip,
    });
  }

  /**
   * 处理登录失败：记录失败次数，超限则锁定账户
   * @param accountId 账户 ID
   * @param email 邮箱
   * @param eventType 事件类型
   * @param deviceFingerprint 设备指纹
   * @param ip 请求 IP
   */
  private async handleFailedLogin(
    accountId: string,
    email: string,
    eventType: AuditEventType,
    deviceFingerprint: string,
    ip: string,
  ) {
    const account = await this.prisma.account.update({
      where: { id: accountId },
      data: { failedLoginAttempts: { increment: 1 } },
    });

    // 超过最大失败次数，临时锁定
    if (account.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      await this.prisma.account.update({
        where: { id: accountId },
        data: {
          status: AccountStatus.LOCKED_TEMPORARY,
          lockedUntil: new Date(Date.now() + LOCK_DURATION_MS),
        },
      });
    }

    // 审计日志
    await this.auditService.log({
      accountId,
      eventType,
      ipAddress: ip,
      metadata: {
        email: this.maskEmail(email),
        deviceFingerprint: deviceFingerprint.slice(-6),
        attemptsRemaining: Math.max(
          0,
          MAX_FAILED_ATTEMPTS - account.failedLoginAttempts,
        ),
      },
    });
  }

  /**
   * 检查账户是否处于锁定状态
   */
  private isAccountLocked(account: {
    status: AccountStatus;
    lockedUntil: Date | null;
  }): boolean {
    if (account.status === AccountStatus.LOCKED_PERMANENT) return true;
    if (account.status === AccountStatus.SUSPENDED) return true;
    if (
      account.status === AccountStatus.LOCKED_TEMPORARY &&
      account.lockedUntil &&
      account.lockedUntil > new Date()
    ) {
      return true;
    }
    // 临时锁定已过期，自动解锁
    if (
      account.status === AccountStatus.LOCKED_TEMPORARY &&
      account.lockedUntil &&
      account.lockedUntil <= new Date()
    ) {
      // 异步解锁，不阻塞当前请求
      this.prisma.account
        .update({
          where: { id: (account as any).id },
          data: {
            status: AccountStatus.ACTIVE,
            lockedUntil: null,
            failedLoginAttempts: 0,
          },
        })
        .catch(() => {}); // 静默失败
      return false;
    }
    return false;
  }

  /**
   * 生成 Emergency Kit 下载链接（简化版）
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private async generateEmergencyKit(accountId: string): Promise<string> {
    // TODO: 实际实现应生成 PDF 并上传至 CDN
    // 1. 使用 pdfkit 生成包含 Secret Key 和恢复码的 PDF
    // 2. 上传至 CDN 并生成预签名 URL（单次下载，1小时有效期）
    const token = crypto.randomBytes(32).toString('hex');
    return `https://cdn.example.com/emergency-kits/${accountId}.pdf?token=${token}`;
  }

  /** 邮箱掩码 */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
  }

  /** 随机延迟（防时序攻击） */
  private randomDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  /** 解析 JWT expiresIn 字符串为毫秒数 */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // 默认 7 天
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
