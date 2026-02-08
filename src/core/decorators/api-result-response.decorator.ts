import { applyDecorators, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiResultDto } from '@/core/dto/api-result.dto';

/**
 * 为 Controller 方法声明 Result API 成功响应（200）
 * 使用方式：@ApiResultResponse(UserDto) 或 @ApiResultResponse(UserDto, '获取用户成功')
 */
export function ApiResultResponse<T extends Type<unknown>>(
  dataDto: T,
  description = '请求成功',
) {
  return applyDecorators(
    ApiExtraModels(ApiResultDto, dataDto),
    ApiResponse({
      status: 200,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResultDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(dataDto) },
            },
          },
        ],
      },
    }),
  );
}

/**
 * 声明 data 为数组的 Result 响应（如列表接口）
 */
export function ApiResultListResponse<T extends Type<unknown>>(
  itemDto: T,
  description = '列表请求成功',
) {
  return applyDecorators(
    ApiExtraModels(ApiResultDto, itemDto),
    ApiResponse({
      status: 200,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResultDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(itemDto) },
              },
            },
          },
        ],
      },
    }),
  );
}

/**
 * 声明 201 创建成功 + Result 包装
 */
export function ApiResultCreatedResponse<T extends Type<unknown>>(
  dataDto: T,
  description = '创建成功',
) {
  return applyDecorators(
    ApiExtraModels(ApiResultDto, dataDto),
    ApiResponse({
      status: 201,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResultDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(dataDto) },
            },
          },
        ],
      },
    }),
  );
}

/**
 * 声明 204 无内容（仍以 Result 风格返回 code/message/data:null，实际由拦截器统一为 200+body）
 */
export function ApiResultNoContentResponse(
  description = '操作成功，无返回内容',
) {
  return applyDecorators(
    ApiExtraModels(ApiResultDto),
    ApiResponse({
      status: 200,
      description,
      schema: {
        $ref: getSchemaPath(ApiResultDto),
      },
    }),
  );
}
