import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { AuditEventType } from '@/generated/prisma/enums';

export interface AuditLogInput {
  /** 账户 ID（可为空，如注册前事件） */
  accountId?: string;
  /** 审计事件类型 */
  eventType: AuditEventType;
  /** 请求 IP 地址 */
  ipAddress: string;
  /** User-Agent */
  userAgent?: string;
  /** 脱敏元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 审计日志服务（SOC 2 合规）
 *
 * 提供统一的审计日志写入能力，所有模块均可注入使用。
 * 日志写入失败不会影响主业务流程（静默降级）。
 *
 * @example
 * ```ts
 * await this.auditService.log({
 *   accountId: account.id,
 *   eventType: AuditEventType.LOGIN_SUCCESS,
 *   ipAddress: req.ip,
 *   metadata: { deviceFingerprint: '...abc' },
 * });
 * ```
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 写入审计日志
   * 采用 fire-and-forget 友好模式：捕获所有异常，不影响调用方
   */
  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          accountId: input.accountId,
          eventType: input.eventType,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
        },
      });
    } catch {
      // 审计日志写入失败不应影响主流程
      console.error('[AUDIT] Failed to write audit log:', input.eventType);
    }
  }

  /**
   * 查询账户审计日志（分页）
   */
  async findByAccount(
    accountId: string,
    options?: { take?: number; skip?: number },
  ) {
    return this.prisma.auditLog.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: options?.take ?? 50,
      skip: options?.skip ?? 0,
    });
  }

  /**
   * 按事件类型查询（安全团队审查用）
   */
  async findByEventType(
    eventType: AuditEventType,
    options?: { take?: number; skip?: number },
  ) {
    return this.prisma.auditLog.findMany({
      where: { eventType },
      orderBy: { createdAt: 'desc' },
      take: options?.take ?? 50,
      skip: options?.skip ?? 0,
    });
  }
}
