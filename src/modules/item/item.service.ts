import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { ItemCategory } from '@/generated/prisma/enums';
import { VaultService } from '@/modules/vault/vault.service';
import type { CreateItemDto, UpdateItemDto } from './dto/request.dto';

@Injectable()
export class ItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vaultService: VaultService,
  ) {}

  async create(accountId: string, vaultId: string, dto: CreateItemDto) {
    await this.vaultService.assertVaultAccess(accountId, vaultId);
    return this.prisma.item.create({
      data: {
        vaultId,
        dataEncrypted: dto.dataEncrypted,
        category: dto.category as ItemCategory,
        favorite: dto.favorite ?? false,
        createdById: accountId,
        updatedById: accountId,
        accountId,
      },
    });
  }

  async findAll(
    accountId: string,
    vaultId: string,
    options?: { category?: ItemCategory; favorite?: boolean },
  ) {
    await this.vaultService.assertVaultAccess(accountId, vaultId);
    const where: {
      vaultId: string;
      deletedAt: null;
      category?: ItemCategory;
      favorite?: boolean;
    } = { vaultId, deletedAt: null };
    if (options?.category != null) where.category = options.category;
    if (options?.favorite != null) where.favorite = options.favorite;

    const items = await this.prisma.item.findMany({
      where,
      orderBy: [{ favorite: 'desc' }, { updatedAt: 'desc' }],
    });
    return { items, total: items.length };
  }

  async findOne(accountId: string, vaultId: string, itemId: string) {
    await this.vaultService.assertVaultAccess(accountId, vaultId);
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, vaultId, deletedAt: null },
    });
    if (!item) {
      throw new NotFoundException('条目不存在');
    }
    return item;
  }

  async update(
    accountId: string,
    vaultId: string,
    itemId: string,
    dto: UpdateItemDto,
  ) {
    await this.vaultService.assertVaultAccess(accountId, vaultId);
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, vaultId, deletedAt: null },
    });
    if (!item) {
      throw new NotFoundException('条目不存在');
    }

    const hasDataChange =
      dto.dataEncrypted != null && dto.dataEncrypted !== item.dataEncrypted;
    if (hasDataChange) {
      const nextVersion = await this.prisma.itemVersion
        .aggregate({
          where: { itemId },
          _max: { versionNumber: true },
        })
        .then((r) => (r._max.versionNumber ?? 0) + 1);
      const version = await this.prisma.itemVersion.create({
        data: {
          itemId,
          dataEncrypted: dto.dataEncrypted!,
          versionNumber: nextVersion,
          changedBy: accountId,
          changeReason: dto.changeReason ?? null,
        },
      });
      await this.prisma.item.update({
        where: { id: itemId },
        data: {
          currentVersionId: version.id,
          dataEncrypted: dto.dataEncrypted,
          ...(dto.category != null && { category: dto.category as ItemCategory }),
          ...(dto.favorite != null && { favorite: dto.favorite }),
          updatedById: accountId,
        },
      });
    } else {
      await this.prisma.item.update({
        where: { id: itemId },
        data: {
          ...(dto.category != null && { category: dto.category as ItemCategory }),
          ...(dto.favorite != null && { favorite: dto.favorite }),
          updatedById: accountId,
        },
      });
    }
    return this.prisma.item.findUniqueOrThrow({ where: { id: itemId } });
  }

  async softDelete(accountId: string, vaultId: string, itemId: string) {
    await this.vaultService.assertVaultAccess(accountId, vaultId);
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, vaultId, deletedAt: null },
    });
    if (!item) {
      throw new NotFoundException('条目不存在');
    }
    await this.prisma.item.update({
      where: { id: itemId },
      data: { deletedAt: new Date() },
    });
  }

  async restore(accountId: string, vaultId: string, itemId: string) {
    await this.vaultService.assertVaultAccess(accountId, vaultId);
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, vaultId },
    });
    if (!item) {
      throw new NotFoundException('条目不存在');
    }
    await this.prisma.item.update({
      where: { id: itemId },
      data: { deletedAt: null },
    });
    return this.prisma.item.findUniqueOrThrow({ where: { id: itemId } });
  }

  async findVersions(accountId: string, vaultId: string, itemId: string) {
    await this.vaultService.assertVaultAccess(accountId, vaultId);
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, vaultId },
    });
    if (!item) {
      throw new NotFoundException('条目不存在');
    }
    const versions = await this.prisma.itemVersion.findMany({
      where: { itemId },
      orderBy: { versionNumber: 'desc' },
    });
    return { versions };
  }

  async findVersion(
    accountId: string,
    vaultId: string,
    itemId: string,
    versionNumber: number,
  ) {
    await this.vaultService.assertVaultAccess(accountId, vaultId);
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, vaultId },
    });
    if (!item) {
      throw new NotFoundException('条目不存在');
    }
    const version = await this.prisma.itemVersion.findUnique({
      where: { itemId_versionNumber: { itemId, versionNumber } },
    });
    if (!version) {
      throw new NotFoundException('版本不存在');
    }
    return version;
  }
}
