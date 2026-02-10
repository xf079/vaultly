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

  private getExceptionMessage(exception: HttpException): string {
    const res = exception.getResponse();
    if (typeof res === 'string') return res;
    if (typeof res === 'object' && res !== null && 'message' in res) {
      const msg = (res as { message?: string | string[] }).message;
      return Array.isArray(msg) ? (msg[0] ?? '') : (msg ?? '');
    }
    return '';
  }

  private getHttpStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
