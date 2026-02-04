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
import { ShareLinkService } from './share-link.service';
import { CreateShareLinkDto } from './dto/create-share-link.dto';
import { UpdateShareLinkDto } from './dto/update-share-link.dto';

@Controller('share-links')
export class ShareLinkController {
  constructor(private readonly shareLinkService: ShareLinkService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateShareLinkDto) {
    return this.shareLinkService.create(dto);
  }

  @Get()
  findMany(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const take = pageSize
      ? Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
      : undefined;
    const skip =
      page && take ? (Math.max(1, parseInt(page, 10)) - 1) * take : undefined;
    return this.shareLinkService.findMany(skip, take);
  }

  @Get('by-token/:token')
  findByToken(@Param('token') token: string) {
    return this.shareLinkService.findByToken(token);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shareLinkService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShareLinkDto,
  ) {
    return this.shareLinkService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.shareLinkService.remove(id);
  }
}
