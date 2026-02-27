/**
 * @file result.interceptor.ts
 * @description 将 Controller 返回值统一包装为 Result API 格式：{ code, message, data }
 * @module core/interceptors/result.interceptor
 *
 * @author xfo79k@gmail.com
 * @copyright Copyright (c) 2026 xfo79k@gmail.com. All rights reserved.
 * @license UNLICENSED
 * @since 2026-02
 */
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResultCode, RESULT_MESSAGES } from '@/core/constants/result-code';
import { KEEP_KEY } from '@/core/constants/decorator';
import type { ApiResult } from '@/core/interfaces/result.interface';

@Injectable()
export class ResultInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResult<unknown>> {
    const keep = this.reflector.getAllAndOverride<boolean>(KEEP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (keep) {
      // 保持原样返回，不做 Result 包装
      return next.handle() as unknown as Observable<ApiResult<unknown>>;
    }

    return next.handle().pipe(
      map((value: unknown) => {
        if (this.isApiResult(value)) {
          return this.ensureTimestamp(value);
        }
        return this.wrapSuccess(value);
      }),
    );
  }

  /**
   * 判断是否为 ApiResult 类型
   * @param value 值
   * @returns 是否为 ApiResult 类型
   */
  private isApiResult(value: unknown): value is ApiResult<unknown> {
    return (
      value !== null &&
      typeof value === 'object' &&
      'code' in value &&
      'message' in value &&
      'data' in value
    );
  }

  /**
   * 包装成功响应
   * @param data 数据
   * @returns 包装后的成功响应
   */
  private wrapSuccess(data: unknown): ApiResult<unknown> {
    return {
      code: ResultCode.OK,
      message: RESULT_MESSAGES[ResultCode.OK],
      data: data ?? null,
      timestamp: Date.now(),
    };
  }

  /**
   * 确保时间戳
   * @param result 结果
   * @returns 确保时间戳后的结果
   */
  private ensureTimestamp(result: ApiResult<unknown>): ApiResult<unknown> {
    if (result.timestamp == null) {
      return { ...result, timestamp: Date.now() };
    }
    return result;
  }
}
