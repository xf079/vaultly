export class CreateTokenDto {
  userId!: number;
  /** EMAIL_VERIFY | PASSWORD_RESET */
  type!: 'EMAIL_VERIFY' | 'PASSWORD_RESET';
  token!: string;
  expiresAt!: string; // ISO date
}
