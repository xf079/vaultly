import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Result API 成功响应体（Swagger 文档用）
 */
export class ApiResultDto<T = unknown> {
  @ApiProperty({ description: '业务状态码，0 表示成功', example: 0 })
  code!: number;

  @ApiProperty({ description: '提示信息', example: 'OK' })
  message!: string;

  @ApiProperty({ description: '业务数据', nullable: true })
  data!: T | null;

  @ApiPropertyOptional({ description: '服务器时间戳' })
  timestamp?: number;

  @ApiPropertyOptional({ description: '请求追踪 ID' })
  requestId?: string;
}

/**
 * Result API 错误响应体（Swagger 文档用）
 */
export class ApiErrorDto {
  @ApiProperty({ description: '业务错误码', example: 40000 })
  code!: number;

  @ApiProperty({ description: '错误信息', example: '请求参数错误' })
  message!: string;

  @ApiProperty({ description: '错误时 data 为 null', nullable: true })
  data!: null;

  @ApiPropertyOptional({ description: '服务器时间戳' })
  timestamp?: number;
}

/**
 * 分页 data 结构（Swagger 文档用）
 */
export class PaginatedMetaDto {
  @ApiProperty({ description: '当前页数据列表' })
  items!: unknown[];

  @ApiProperty({ description: '总条数' })
  total!: number;

  @ApiProperty({ description: '当前页码' })
  page!: number;

  @ApiProperty({ description: '每页条数' })
  pageSize!: number;
}
