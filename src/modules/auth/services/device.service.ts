import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Platform } from '@/generated/prisma/client';

/** 设备信任有效期：1年 */
const TRUST_DURATION_MS = 365 * 24 * 60 * 60 * 1000;

export interface CreateDeviceInput {
  accountId: string;
  fingerprint: string;
  name: string;
  platform: Platform;
  osVersion?: string;
  appVersion?: string;
  biometricEnabled?: boolean;
  pushToken?: string;
}

@Injectable()
export class DeviceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 查找账户的可信设备
   * @param accountId 账户ID
   * @param fingerprint 设备指纹
   * @returns 设备记录或 null
   */
  async findTrustedDevice(accountId: string, fingerprint: string) {
    return this.prisma.device.findFirst({
      where: {
        accountId,
        fingerprint,
        trustedUntil: { gt: new Date() },
      },
    });
  }

  /**
   * 检查设备是否为已信任设备
   * @param accountId 账户ID
   * @param fingerprint 设备指纹
   * @returns 是否已信任
   */
  async isTrusted(accountId: string, fingerprint: string): Promise<boolean> {
    const device = await this.findTrustedDevice(accountId, fingerprint);
    return !!device;
  }

  /**
   * 创建可信设备
   * @param input 设备创建参数
   * @returns 新创建的设备记录
   */
  async createDevice(input: CreateDeviceInput) {
    const now = new Date();
    const trustedUntil = new Date(now.getTime() + TRUST_DURATION_MS);

    // 如果已存在该指纹的设备，更新信任期
    const existing = await this.prisma.device.findFirst({
      where: {
        accountId: input.accountId,
        fingerprint: input.fingerprint,
      },
    });

    if (existing) {
      return this.prisma.device.update({
        where: { id: existing.id },
        data: {
          name: input.name,
          platform: input.platform,
          osVersion: input.osVersion,
          appVersion: input.appVersion,
          biometricEnabled: input.biometricEnabled ?? false,
          pushToken: input.pushToken,
          trustedAt: now,
          trustedUntil,
          lastSeenAt: now,
          isCurrentSession: true,
        },
      });
    }

    return this.prisma.device.create({
      data: {
        accountId: input.accountId,
        fingerprint: input.fingerprint,
        name: input.name,
        platform: input.platform,
        osVersion: input.osVersion,
        appVersion: input.appVersion,
        biometricEnabled: input.biometricEnabled ?? false,
        pushToken: input.pushToken,
        trustedAt: now,
        trustedUntil,
        lastSeenAt: now,
        isCurrentSession: true,
      },
    });
  }

  /**
   * 更新设备最后活跃时间
   * @param deviceId 设备ID
   */
  async updateLastSeen(deviceId: string) {
    await this.prisma.device.update({
      where: { id: deviceId },
      data: { lastSeenAt: new Date() },
    });
  }

  /**
   * 将所有设备的 isCurrentSession 重置为 false
   * @param accountId 账户ID
   */
  async resetCurrentSessions(accountId: string) {
    await this.prisma.device.updateMany({
      where: { accountId, isCurrentSession: true },
      data: { isCurrentSession: false },
    });
  }

  /**
   * 设置指定设备为当前会话
   * @param deviceId 设备ID
   */
  async setCurrentSession(deviceId: string) {
    await this.prisma.device.update({
      where: { id: deviceId },
      data: { isCurrentSession: true },
    });
  }

  /**
   * 移除可信设备（撤销信任）
   * @param accountId 账户ID
   * @param deviceId 设备ID
   */
  async removeDevice(accountId: string, deviceId: string) {
    await this.prisma.device.deleteMany({
      where: { id: deviceId, accountId },
    });
  }

  /**
   * 获取账户所有设备列表
   * @param accountId 账户ID
   */
  async listDevices(accountId: string) {
    return this.prisma.device.findMany({
      where: { accountId },
      orderBy: { lastSeenAt: 'desc' },
    });
  }
}
