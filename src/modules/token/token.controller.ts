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
import { TokenService } from './token.service';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';

@Controller('tokens')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTokenDto) {
    return this.tokenService.create(dto);
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
    return this.tokenService.findMany(skip, take, uid);
  }

  @Get('by-token/:token')
  findByToken(@Param('token') token: string) {
    return this.tokenService.findByToken(token);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tokenService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTokenDto) {
    return this.tokenService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.tokenService.remove(id);
  }
}
