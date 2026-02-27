import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiResultResponse,
  ApiResultCreatedResponse,
  ApiResultNoContentResponse,
} from '@/core';
import { CurrentAccount, JwtAuthGuard } from '@/shared';
import type { JwtPayload } from '@/shared/interfaces/jwt-payload.interface';
import { ItemService } from './item.service';
import {
  ItemResponseDto,
  ItemListResponseDto,
  ItemVersionResponseDto,
  ItemVersionListResponseDto,
} from './dto/response.dto';
import { CreateItemDto, UpdateItemDto } from './dto/request.dto';
import { ItemCategory } from '@/generated/prisma/enums';

@ApiTags('保险库条目')
@Controller('vaults/:vaultId/items')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建条目' })
  @ApiResultCreatedResponse(ItemResponseDto, '创建成功')
  create(
    @CurrentAccount() account: JwtPayload,
    @Param('vaultId') vaultId: string,
    @Body() dto: CreateItemDto,
  ) {
    return this.itemService.create(account.sub, vaultId, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '条目列表' })
  @ApiResultResponse(ItemListResponseDto, '列表')
  findAll(
    @CurrentAccount() account: JwtPayload,
    @Param('vaultId') vaultId: string,
    @Query('category') category?: ItemCategory,
    @Query('favorite') favorite?: string,
  ) {
    return this.itemService.findAll(account.sub, vaultId, {
      category,
      favorite:
        favorite === 'true' ? true : favorite === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '条目详情' })
  @ApiResultResponse(ItemResponseDto, '详情')
  findOne(
    @CurrentAccount() account: JwtPayload,
    @Param('vaultId') vaultId: string,
    @Param('id') id: string,
  ) {
    return this.itemService.findOne(account.sub, vaultId, id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新条目' })
  @ApiResultResponse(ItemResponseDto, '更新成功')
  update(
    @CurrentAccount() account: JwtPayload,
    @Param('vaultId') vaultId: string,
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.itemService.update(account.sub, vaultId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '软删除条目' })
  @ApiResultNoContentResponse('已删除')
  async remove(
    @CurrentAccount() account: JwtPayload,
    @Param('vaultId') vaultId: string,
    @Param('id') id: string,
  ) {
    await this.itemService.softDelete(account.sub, vaultId, id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '从软删除恢复' })
  @ApiResultResponse(ItemResponseDto, '已恢复')
  restore(
    @CurrentAccount() account: JwtPayload,
    @Param('vaultId') vaultId: string,
    @Param('id') id: string,
  ) {
    return this.itemService.restore(account.sub, vaultId, id);
  }

  @Get(':id/versions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '条目版本列表' })
  @ApiResultResponse(ItemVersionListResponseDto, '版本列表')
  findVersions(
    @CurrentAccount() account: JwtPayload,
    @Param('vaultId') vaultId: string,
    @Param('id') id: string,
  ) {
    return this.itemService.findVersions(account.sub, vaultId, id);
  }

  @Get(':id/versions/:versionNumber')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '指定版本内容' })
  @ApiResultResponse(ItemVersionResponseDto, '版本详情')
  findVersion(
    @CurrentAccount() account: JwtPayload,
    @Param('vaultId') vaultId: string,
    @Param('id') id: string,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
  ) {
    return this.itemService.findVersion(
      account.sub,
      vaultId,
      id,
      versionNumber,
    );
  }
}
