export class UpdateUserDto {
  email?: string;
  emailHash?: string;
  salt?: string;
  has2fa?: boolean;
}
