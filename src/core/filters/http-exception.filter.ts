/**
 * @file http-exception.filter.ts
 * @description HTTP 异常过滤器，将异常转换为 Result API 格式
 * @module core/filters/http-exception.filter
 *
 * @author xfo79k@gmail.com
 * @copyright Copyright (c) 2026 xfo79k@gmail.com. All rights reserved.
 * @license UNLICENSED
 * @since 2026-02
 */
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { type Response } from 'express';
import { HttpException } from '@nestjs/common';
import { ResultCode, RESULT_MESSAGES } from '@/core/constants/result-code';
import type { ApiResult } from '@/core/interfaces/result.interface';

const HTTP_TO_RESULT_CODE: Record<number, ResultCode> = {
  [HttpStatus.BAD_REQUEST]: ResultCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ResultCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ResultCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ResultCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ResultCode.CONFLICT,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ResultCode.UNPROCESSABLE_ENTITY,
  [HttpStatus.INTERNAL_SERVER_ERROR]: ResultCode.INTERNAL_SERVER_ERROR,
  [HttpStatus.SERVICE_UNAVAILABLE]: ResultCode.SERVICE_UNAVAILABLE,
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * 捕获异常并转换为 ApiResult 格式
   * @param exception 异常
   * @param host 参数主机
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const result = this.toApiResult(exception);
    const status = this.getHttpStatus(exception);
    this.logger.warn(
      `[${status}] ${result.message} (code=${result.code})`,
      exception instanceof Error ? exception.stack : undefined,
    );
    response.status(status).json(result);
  }

  /**
   * 将异常转换为 ApiResult 格式
   * @param exception 异常
   * @returns ApiResult 格式
   */
  private toApiResult(exception: unknown): ApiResult<null> {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code = HTTP_TO_RESULT_CODE[status] ?? (status as ResultCode);
      const message = this.getExceptionMessage(exception);
      return {
        code,
        message: message || (RESULT_MESSAGES[code] ?? 'Unknown'),
        data: null,
        timestamp: Date.now(),
      };
    }
    return {
      code: ResultCode.INTERNAL_SERVER_ERROR,
      message:
        exception instanceof Error
          ? exception.message
          : RESULT_MESSAGES[ResultCode.INTERNAL_SERVER_ERROR],
      data: null,
      timestamp: Date.now(),
    };
  }

  /**
   * 获取异常消息
   * @param exception 异常
   * @returns 异常消息
   */
  private getExceptionMessage(exception: HttpException): string {
    const res = exception.getResponse();
    if (typeof res === 'string') return res;
    if (typeof res === 'object' && res !== null && 'message' in res) {
      const msg = (res as { message?: string | string[] }).message;
      return Array.isArray(msg) ? (msg[0] ?? '') : (msg ?? '');
    }
    return '';
  }

  /**
   * 获取 HTTP 状态码
   * @param exception 异常
   * @returns HTTP 状态码
   */
  private getHttpStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
