import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAuditLogDto) {
    return this.auditLogService.create(dto);
  }

  @Get()
  findMany(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('userId') userId?: string,
  ) {
    const take = pageSize
      ? Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
      : undefined;
    const skip =
      page && take ? (Math.max(1, parseInt(page, 10)) - 1) * take : undefined;
    const uid = userId ? parseInt(userId, 10) : undefined;
    return this.auditLogService.findMany(skip, take, uid);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.auditLogService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.auditLogService.remove(id);
  }
}
