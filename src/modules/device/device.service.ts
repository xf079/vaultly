import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { CreateDeviceDto } from './dto/create-device.dto';
import type { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DeviceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDeviceDto) {
    return await this.prisma.device.create({
      data: {
        userId: dto.userId,
        deviceName: dto.deviceName ?? undefined,
        userAgent: dto.userAgent ?? undefined,
        ipHash: dto.ipHash ?? undefined,
        expiresAt: new Date(dto.expiresAt),
      },
    });
  }

  async findMany(skip?: number, take?: number, userId?: number) {
    const where = userId != null ? { userId } : {};
    const [list, total] = await Promise.all([
      this.prisma.device.findMany({
        where,
        skip,
        take,
        orderBy: { lastActiveAt: 'desc' },
      }),
      this.prisma.device.count({ where }),
    ]);
    return { list, total };
  }

  async findOne(id: string) {
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('设备不存在');
    return device;
  }

  async update(id: string, dto: UpdateDeviceDto) {
    await this.findOne(id);
    return this.prisma.device.update({
      where: { id },
      data: {
        ...(dto.deviceName !== undefined && { deviceName: dto.deviceName }),
        ...(dto.userAgent !== undefined && { userAgent: dto.userAgent }),
        ...(dto.ipHash !== undefined && { ipHash: dto.ipHash }),
        ...(dto.isRevoked != null && { isRevoked: dto.isRevoked }),
        ...(dto.expiresAt != null && { expiresAt: new Date(dto.expiresAt) }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.device.delete({ where: { id } });
  }
}
