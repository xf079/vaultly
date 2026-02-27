import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { JwtPayload } from '@/shared/interfaces/jwt-payload.interface';
import { DeviceService } from '../../device/device.service';

/**
 * 设备信任守卫
 * 验证请求是否来自已信任的设备，需配合 JwtAuthGuard 使用
 *
 * @example
 * ```ts
 * @UseGuards(JwtAuthGuard, DeviceTrustGuard)
 * @Get('vaults')
 * getVaults() { ... }
 * ```
 */
@Injectable()
export class DeviceTrustGuard implements CanActivate {
  constructor(private readonly deviceService: DeviceService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user) {
      throw new ForbiddenException('需要先通过身份认证');
    }

    const fingerprint = request.headers['x-device-fingerprint'] as string;
    if (!fingerprint) {
      throw new ForbiddenException('缺少设备指纹');
    }

    const isTrusted = await this.deviceService.isTrusted(user.sub, fingerprint);
    if (!isTrusted) {
      throw new ForbiddenException('设备未被信任，请先注册设备');
    }

    // 更新设备活跃时间
    const device = await this.deviceService.findTrustedDevice(
      user.sub,
      fingerprint,
    );
    if (device) {
      await this.deviceService.updateLastSeen(device.id);
    }

    return true;
  }
}
