/**
 * @file api-error-responses.decorator.ts
 * @description 为接口声明 Result API 风格的 4xx/5xx 错误响应（Swagger 文档用）
 * @module core/decorators/api-error-responses.decorator
 *
 * @author xfo79k@gmail.com
 * @copyright Copyright (c) 2026 xfo79k@gmail.com. All rights reserved.
 * @license UNLICENSED
 * @since 2026-02
 */
import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

/**
 * 为接口声明 Result API 风格的 4xx/5xx 错误响应（Swagger 文档用）
 * @returns 装饰器
 */
export function ApiErrorResponses() {
  return applyDecorators(
    ApiResponse({
      status: 400,
      description: '请求参数错误',
      schema: {
        example: {
          code: 40000,
          message: '请求参数错误',
          data: null,
          timestamp: 1707200000000,
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: '未授权',
      schema: {
        example: {
          code: 40100,
          message: '未授权',
          data: null,
          timestamp: 1707200000000,
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: '禁止访问',
      schema: {
        example: {
          code: 40300,
          message: '禁止访问',
          data: null,
          timestamp: 1707200000000,
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: '资源不存在',
      schema: {
        example: {
          code: 40400,
          message: '资源不存在',
          data: null,
          timestamp: 1707200000000,
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: '资源冲突',
      schema: {
        example: {
          code: 40900,
          message: '资源冲突',
          data: null,
          timestamp: 1707200000000,
        },
      },
    }),
    ApiResponse({
      status: 422,
      description: '请求体验证失败',
      schema: {
        example: {
          code: 42200,
          message: '请求体验证失败',
          data: null,
          timestamp: 1707200000000,
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: '服务器内部错误',
      schema: {
        example: {
          code: 50000,
          message: '服务器内部错误',
          data: null,
          timestamp: 1707200000000,
        },
      },
    }),
  );
}
