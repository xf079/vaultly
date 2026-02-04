export class CreateDeviceDto {
  userId!: number;
  deviceName?: string | null;
  userAgent?: string | null;
  ipHash?: string | null;
  expiresAt!: string; // ISO date
}
