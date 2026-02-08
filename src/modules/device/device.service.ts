import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import type { CreateDeviceDto } from './dto/create-device.dto';
import type { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DeviceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDeviceDto) {}

  async findMany(skip?: number, take?: number, userId?: number) {}

  async findOne(id: string) {
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('设备不存在');
    return device;
  }

  async update(id: string, dto: UpdateDeviceDto) {}

  async remove(id: string) {}
}
