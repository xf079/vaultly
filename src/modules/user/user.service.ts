import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    return await this.prisma.user.create({
      data: {
        email: dto.email,
        emailHash: dto.emailHash,
        salt: dto.salt,
        has2fa: dto.has2fa ?? false,
      },
    });
  }

  async findMany(skip?: number, take?: number) {
    const [list, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { list, total };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.email != null && { email: dto.email }),
        ...(dto.emailHash != null && { emailHash: dto.emailHash }),
        ...(dto.salt != null && { salt: dto.salt }),
        ...(dto.has2fa != null && { has2fa: dto.has2fa }),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }
}
