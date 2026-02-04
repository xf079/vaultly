import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAuditLogDto) {
    return await this.prisma.auditLog.create({
      data: {
        userId: dto.userId,
        action: dto.action,
        resourceType: dto.resourceType ?? undefined,
        resourceId: dto.resourceId ?? undefined,
        metadata: dto.metadata as object | undefined,
        ipAddress: dto.ipAddress ?? undefined,
      },
    });
  }

  async findMany(skip?: number, take?: number, userId?: number) {
    const where = userId != null ? { userId } : {};
    const [list, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { list, total };
  }

  async findOne(id: number) {
    const log = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('审计日志不存在');
    return log;
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.auditLog.delete({ where: { id } });
  }
}
