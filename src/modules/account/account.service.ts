import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import type { CreateAccountDto } from './dto/create-account.dto';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAccountDto) {
    return await this.prisma.account.create({ data: dto });
  }

  async remove(id: string) {
    return await this.prisma.account.delete({ where: { id } });
  }
}
