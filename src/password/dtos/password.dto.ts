import { IsNotEmpty, IsString } from 'class-validator';

export class forgotPasswordInputDto {
  @IsString()
  @IsNotEmpty()
  email: string;
}

export class resetPasswordInputDto {
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
