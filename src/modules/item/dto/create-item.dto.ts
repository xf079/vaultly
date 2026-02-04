export class CreateItemDto {
  type!: string;
  data!: string;
  iv!: string;
  metadata?: unknown;
  parentId?: number | null;
  userId!: number;
}
