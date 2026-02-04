export class CreateAuditLogDto {
  userId!: number;
  action!: string;
  resourceType?: string | null;
  resourceId?: number | null;
  metadata?: unknown;
  ipAddress?: string | null;
}
