import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResultCode, RESULT_MESSAGES } from '@/core/constants/result-code';
import type { ApiResult } from '@/core/interfaces/result.interface';

/**
 * 将 Controller 返回值统一包装为 Result API 格式：{ code, message, data }
 * 若返回值已是 ApiResult 则不再二次包装
 */
@Injectable()
export class ResultInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResult<unknown>> {
    return next.handle().pipe(
      map((value: unknown) => {
        if (this.isApiResult(value)) {
          return this.ensureTimestamp(value as ApiResult<unknown>);
        }
        return this.wrapSuccess(value);
      }),
    );
  }

  private isApiResult(value: unknown): value is ApiResult<unknown> {
    return (
      value !== null &&
      typeof value === 'object' &&
      'code' in value &&
      'message' in value &&
      'data' in value
    );
  }

  private wrapSuccess(data: unknown): ApiResult<unknown> {
    return {
      code: ResultCode.OK,
      message: RESULT_MESSAGES[ResultCode.OK],
      data: data ?? null,
      timestamp: Date.now(),
    };
  }

  private ensureTimestamp(result: ApiResult<unknown>): ApiResult<unknown> {
    if (result.timestamp == null) {
      return { ...result, timestamp: Date.now() };
    }
    return result;
  }
}
