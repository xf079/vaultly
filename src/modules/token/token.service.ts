import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { CreateTokenDto } from './dto/create-token.dto';
import type { UpdateTokenDto } from './dto/update-token.dto';

@Injectable()
export class TokenService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTokenDto) {
    return await this.prisma.token.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        token: dto.token,
        expiresAt: new Date(dto.expiresAt),
      },
    });
  }

  async findMany(skip?: number, take?: number, userId?: number) {
    const where = userId != null ? { userId } : {};
    const [list, total] = await Promise.all([
      this.prisma.token.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.token.count({ where }),
    ]);
    return { list, total };
  }

  async findOne(id: number) {
    const token = await this.prisma.token.findUnique({ where: { id } });
    if (!token) throw new NotFoundException('令牌不存在');
    return token;
  }

  async findByToken(token: string) {
    return await this.prisma.token.findUnique({ where: { token } });
  }

  async update(id: number, dto: UpdateTokenDto) {
    await this.findOne(id);
    return this.prisma.token.update({
      where: { id },
      data: {
        ...(dto.usedAt !== undefined && {
          usedAt: dto.usedAt ? new Date(dto.usedAt) : null,
        }),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.token.delete({ where: { id } });
  }
}
