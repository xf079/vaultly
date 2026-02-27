import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { VaultType } from '@/generated/prisma/enums';
import type { CreateVaultDto } from './dto/request.dto';
import type { UpdateVaultDto } from './dto/request.dto';

@Injectable()
export class VaultService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 校验当前用户是否对该保险库有访问权（拥有者或已接受共享）
   */
  async assertVaultAccess(accountId: string, vaultId: string): Promise<void> {
    const vault = await this.prisma.vault.findFirst({
      where: { id: vaultId, deletedAt: null },
      include: {
        shares: {
          where: {
            sharedWithAccountId: accountId,
            status: 'ACCEPTED',
          },
        },
      },
    });
    if (!vault) {
      throw new NotFoundException('保险库不存在');
    }
    const isOwner = vault.accountId === accountId;
    const hasShare = vault.shares.length > 0;
    if (!isOwner && !hasShare) {
      throw new ForbiddenException('无权限访问该保险库');
    }
  }

  /**
   * 校验是否为保险库拥有者（用于更新/删除/共享管理）
   */
  async assertVaultOwner(accountId: string, vaultId: string): Promise<void> {
    const vault = await this.prisma.vault.findFirst({
      where: { id: vaultId, deletedAt: null },
    });
    if (!vault) {
      throw new NotFoundException('保险库不存在');
    }
    if (vault.accountId !== accountId) {
      throw new ForbiddenException('仅创建者可执行此操作');
    }
  }

  async create(accountId: string, dto: CreateVaultDto) {
    return this.prisma.vault.create({
      data: {
        accountId,
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        type: dto.type,
        vaultKey: dto.vaultKey,
        isFavorite: dto.isFavorite ?? false,
        isArchived: dto.isArchived ?? false,
      },
    });
  }

  async findAll(accountId: string, options?: { includeArchived?: boolean }) {
    const where: { accountId: string; deletedAt: null; isArchived?: boolean } =
      {
        accountId,
        deletedAt: null,
      };
    if (options?.includeArchived === false) {
      where.isArchived = false;
    }
    const vaults = await this.prisma.vault.findMany({
      where,
      orderBy: [{ isFavorite: 'desc' }, { updatedAt: 'desc' }],
      include: { _count: { select: { items: true, shares: true } } },
    });
    return { vaults, total: vaults.length };
  }

  async findOne(accountId: string, vaultId: string) {
    await this.assertVaultAccess(accountId, vaultId);
    const vault = await this.prisma.vault.findFirst({
      where: { id: vaultId, deletedAt: null },
      include: { _count: { select: { items: true, shares: true } } },
    });
    if (!vault) {
      throw new NotFoundException('保险库不存在');
    }
    return vault;
  }

  async update(accountId: string, vaultId: string, dto: UpdateVaultDto) {
    await this.assertVaultOwner(accountId, vaultId);
    return this.prisma.vault.update({
      where: { id: vaultId },
      data: {
        ...(dto.name != null && { name: dto.name }),
        ...(dto.description != null && { description: dto.description }),
        ...(dto.icon != null && { icon: dto.icon }),
        ...(dto.type != null && { type: dto.type }),
        ...(dto.vaultKey != null && { vaultKey: dto.vaultKey }),
        ...(dto.isFavorite != null && { isFavorite: dto.isFavorite }),
        ...(dto.isArchived != null && { isArchived: dto.isArchived }),
      },
    });
  }

  async softDelete(accountId: string, vaultId: string) {
    await this.assertVaultOwner(accountId, vaultId);
    await this.prisma.vault.update({
      where: { id: vaultId },
      data: { deletedAt: new Date() },
    });
  }

  async restore(accountId: string, vaultId: string) {
    await this.assertVaultOwner(accountId, vaultId);
    await this.prisma.vault.update({
      where: { id: vaultId },
      data: { deletedAt: null },
    });
  }
}
