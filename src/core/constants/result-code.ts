/**
 * @file result-code.ts
 * @description 结果码常量
 * @module core/constants/result-code
 *
 * @author xfo79k@gmail.com
 * @copyright Copyright (c) 2026 xfo79k@gmail.com. All rights reserved.
 * @license UNLICENSED
 * @since 2026-02
 */

/**
 * 结果码枚举
 */
export enum ResultCode {
  /** 成功 */
  OK = 0,

  /** 客户端错误 4xx -> 4xxxx */
  BAD_REQUEST = 40000,
  UNAUTHORIZED = 40100,
  FORBIDDEN = 40300,
  NOT_FOUND = 40400,
  CONFLICT = 40900,
  UNPROCESSABLE_ENTITY = 42200,

  /** 服务端错误 5xx -> 5xxxx */
  INTERNAL_SERVER_ERROR = 50000,
  SERVICE_UNAVAILABLE = 50300,
}

export const RESULT_MESSAGES: Record<ResultCode, string> = {
  [ResultCode.OK]: 'OK',
  [ResultCode.BAD_REQUEST]: '请求参数错误',
  [ResultCode.UNAUTHORIZED]: '未授权',
  [ResultCode.FORBIDDEN]: '禁止访问',
  [ResultCode.NOT_FOUND]: '资源不存在',
  [ResultCode.CONFLICT]: '资源冲突',
  [ResultCode.UNPROCESSABLE_ENTITY]: '请求体验证失败',
  [ResultCode.INTERNAL_SERVER_ERROR]: '服务器内部错误',
  [ResultCode.SERVICE_UNAVAILABLE]: '服务暂不可用',
};
