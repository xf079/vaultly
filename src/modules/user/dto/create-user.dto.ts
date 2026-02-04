export class CreateUserDto {
  email!: string;
  emailHash!: string;
  salt!: string;
  has2fa?: boolean;
}
