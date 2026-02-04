import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { CreateShareLinkDto } from './dto/create-share-link.dto';
import type { UpdateShareLinkDto } from './dto/update-share-link.dto';

@Injectable()
export class ShareLinkService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateShareLinkDto) {
    return await this.prisma.shareLink.create({
      data: {
        token: dto.token,
        encryptedData: dto.encryptedData,
        iv: dto.iv,
        expiresAt: new Date(dto.expiresAt),
        maxViews: dto.maxViews ?? 1,
      },
    });
  }

  async findMany(skip?: number, take?: number) {
    const [list, total] = await Promise.all([
      this.prisma.shareLink.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.shareLink.count(),
    ]);
    return { list, total };
  }

  async findOne(id: number) {
    const link = await this.prisma.shareLink.findUnique({ where: { id } });
    if (!link) throw new NotFoundException('分享链接不存在');
    return link;
  }

  async findByToken(token: string) {
    return await this.prisma.shareLink.findUnique({ where: { token } });
  }

  async update(id: number, dto: UpdateShareLinkDto) {
    await this.findOne(id);
    return this.prisma.shareLink.update({
      where: { id },
      data: {
        ...(dto.encryptedData != null && { encryptedData: dto.encryptedData }),
        ...(dto.iv != null && { iv: dto.iv }),
        ...(dto.expiresAt != null && { expiresAt: new Date(dto.expiresAt) }),
        ...(dto.maxViews != null && { maxViews: dto.maxViews }),
        ...(dto.viewCount != null && { viewCount: dto.viewCount }),
        ...(dto.isConsumed != null && { isConsumed: dto.isConsumed }),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.shareLink.delete({ where: { id } });
  }
}
