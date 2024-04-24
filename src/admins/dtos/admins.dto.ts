import { IsNotEmpty, IsString } from 'class-validator';

export class LoginAdminDto {
  token: string;
  email: string;
}

export class createAdminDto {
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  email: string;
}

export class giveUserFreeProductSubscriptionInputDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  productId: string;
}

export class cancelAnyUserSubscriptionInputDto {
  @IsString()
  @IsNotEmpty()
  email: string;
}
