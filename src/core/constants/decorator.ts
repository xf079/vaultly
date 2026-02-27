/**
 * @file decorator.ts
 * @description 装饰器常量
 * @module core/constants/decorator
 *
 * @author xfo79k@gmail.com
 * @copyright Copyright (c) 2026 xfo79k@gmail.com. All rights reserved.
 * @license UNLICENSED
 * @since 2026-02
 */

/* 保持原数据返回 */
export const KEEP_KEY = 'common:keep';

/* 开发接口，无需登录,不进行 jwt 校验 */
export const PUBLIC_KEY = 'common:public';

/* 操作权限标识 */
export const PERMISSION_KEY_METADATA = 'common:permission';

/* 角色标识 */
export const ROLES_KEY_METADATA = 'common:roles';

/* 记录日志 */
export const LOG_KEY_METADATA = 'common:log';

/* 数据权限 */
export const DATA_SCOPE_KEY_METADATA = 'common:dataScope';

/* 防止重复提交 */
export const REPEAT_SUBMIT_METADATA = 'common:repeatSubmit';
