export class UpdateDeviceDto {
  deviceName?: string | null;
  userAgent?: string | null;
  ipHash?: string | null;
  isRevoked?: boolean;
  expiresAt?: string; // ISO date
}
