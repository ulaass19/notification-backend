import { IsString, IsEmail } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string; // 6 haneli OTP
}
