import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Delete,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import {
  ApiResultCreatedResponse,
  ApiErrorResponses,
  ApiResultNoContentResponse,
} from '@/core';

@ApiTags('accounts')
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建账户' })
  @ApiResultCreatedResponse(CreateAccountDto, '创建成功')
  @ApiErrorResponses()
  create(@Body() dto: CreateAccountDto) {
    return this.accountService.create(dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除账户' })
  @ApiResultNoContentResponse('删除成功')
  @ApiErrorResponses()
  delete(@Param('id') id: string) {
    return this.accountService.remove(id);
  }
}
