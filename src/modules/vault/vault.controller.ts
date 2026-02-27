import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { VaultService } from './vault.service';
import { VaultListResponseDto, VaultResponseDto } from './dto/response.dto';
import { CreateVaultDto, UpdateVaultDto } from './dto/request.dto';

@ApiTags('保险库')
@Controller('vaults')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VaultController {
  constructor(private readonly vaultService: VaultService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建保险库' })
  @ApiResultCreatedResponse(VaultResponseDto, '创建成功')
  create(@CurrentAccount() account: JwtPayload, @Body() dto: CreateVaultDto) {
    return this.vaultService.create(account.sub, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '保险库列表' })
  @ApiResultResponse(VaultListResponseDto, '列表')
  findAll(
    @CurrentAccount() account: JwtPayload,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.vaultService.findAll(account.sub, {
      includeArchived: includeArchived === 'true',
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '保险库详情' })
  @ApiResultResponse(VaultResponseDto, '详情')
  findOne(@CurrentAccount() account: JwtPayload, @Param('id') id: string) {
    return this.vaultService.findOne(account.sub, id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新保险库' })
  @ApiResultResponse(VaultResponseDto, '更新成功')
  update(
    @CurrentAccount() account: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateVaultDto,
  ) {
    return this.vaultService.update(account.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '软删除保险库' })
  @ApiResultNoContentResponse('已删除')
  async remove(@CurrentAccount() account: JwtPayload, @Param('id') id: string) {
    await this.vaultService.softDelete(account.sub, id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '从软删除恢复' })
  @ApiResultResponse(VaultResponseDto, '已恢复')
  restore(@CurrentAccount() account: JwtPayload, @Param('id') id: string) {
    return this.vaultService.restore(account.sub, id);
  }
}
