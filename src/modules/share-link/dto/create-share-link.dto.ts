export class CreateShareLinkDto {
  token!: string;
  encryptedData!: string;
  iv!: string;
  expiresAt!: string; // ISO date
  maxViews?: number;
}
