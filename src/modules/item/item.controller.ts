import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateItemDto) {
    return this.itemService.create(dto);
  }

  @Get()
  findMany(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('userId') userId?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const take = pageSize
      ? Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
      : undefined;
    const skip =
      page && take ? (Math.max(1, parseInt(page, 10)) - 1) * take : undefined;
    const uid = userId ? parseInt(userId, 10) : undefined;
    return this.itemService.findMany(
      skip,
      take,
      uid,
      includeDeleted === 'true',
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId') userId?: string,
  ) {
    const uid = userId ? parseInt(userId, 10) : undefined;
    return this.itemService.findOne(id, uid);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateItemDto,
    @Query('userId') userId?: string,
  ) {
    const uid = userId ? parseInt(userId, 10) : undefined;
    return this.itemService.update(id, dto, uid);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId') userId?: string,
  ) {
    const uid = userId ? parseInt(userId, 10) : undefined;
    await this.itemService.remove(id, uid);
  }
}
