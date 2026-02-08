/**
 * Result API 风格：统一响应体
 * - 成功: { code: 0, message, data }
 * - 失败: { code: number, message, data: null }
 */
export interface ApiResult<T = unknown> {
  code: number;
  message: string;
  data: T | null;
  /** 可选：请求追踪、时间戳等企业级字段 */
  timestamp?: number;
  requestId?: string;
}

/**
 * 分页数据结构（作为 data 使用）
 */
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 无 body 的成功响应（如 204），data 固定为 null
 */
export type ApiResultVoid = ApiResult<null>;
