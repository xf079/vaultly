export class UpdateItemDto {
  type?: string;
  data?: string;
  iv?: string;
  metadata?: unknown;
  isDeleted?: boolean;
  version?: number;
  parentId?: number | null;
}
