import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { CreateItemDto } from './dto/create-item.dto';
import type { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateItemDto) {
    return await this.prisma.item.create({
      data: {
        type: dto.type,
        data: dto.data,
        iv: dto.iv,
        metadata: dto.metadata as object | undefined,
        parentId: dto.parentId ?? undefined,
        userId: dto.userId,
      },
    });
  }

  async findMany(
    skip?: number,
    take?: number,
    userId?: number,
    includeDeleted = false,
  ) {
    const where: { userId?: number; isDeleted?: boolean } = {};
    if (userId != null) where.userId = userId;
    if (!includeDeleted) where.isDeleted = false;
    const [list, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.item.count({ where }),
    ]);
    return { list, total };
  }

  async findOne(id: number, userId?: number) {
    const item = await this.prisma.item.findFirst({
      where: { id, ...(userId != null ? { userId } : {}) },
    });
    if (!item) throw new NotFoundException('条目不存在');
    return item;
  }

  async update(id: number, dto: UpdateItemDto, userId?: number) {
    await this.findOne(id, userId);
    return this.prisma.item.update({
      where: { id },
      data: {
        ...(dto.type != null && { type: dto.type }),
        ...(dto.data != null && { data: dto.data }),
        ...(dto.iv != null && { iv: dto.iv }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata as object }),
        ...(dto.isDeleted != null && { isDeleted: dto.isDeleted }),
        ...(dto.version != null && { version: dto.version }),
        ...(dto.parentId !== undefined && {
          parentId: dto.parentId ?? undefined,
        }),
      },
    });
  }

  async remove(id: number, userId?: number) {
    await this.findOne(id, userId);
    return this.prisma.item.delete({ where: { id } });
  }
}
