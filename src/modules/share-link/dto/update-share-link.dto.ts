export class UpdateShareLinkDto {
  encryptedData?: string;
  iv?: string;
  expiresAt?: string; // ISO date
  maxViews?: number;
  viewCount?: number;
  isConsumed?: boolean;
}
