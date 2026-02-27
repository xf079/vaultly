/**
 * @file keep.decorator.ts
 * @description 保持原数据返回的装饰器
 * @module core/decorators/keep.decorator
 *
 * @author xfo79k@gmail.com
 * @copyright Copyright (c) 2026 xfo79k@gmail.com. All rights reserved.
 * @license UNLICENSED
 * @since 2026-02
 */

import { SetMetadata } from '@nestjs/common';
import { KEEP_KEY } from '../constants/decorator';

/**
 * 保持原数据返回的装饰器
 * @returns 装饰器
 */
export const Keep = () => SetMetadata(KEEP_KEY, true);
