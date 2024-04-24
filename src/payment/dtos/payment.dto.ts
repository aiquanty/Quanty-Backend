import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class PaymentRequestBody {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;
  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}

export class createSubscriptionBodyDto {
  @IsString()
  @IsNotEmpty()
  productId: string;
}

export class createSubscriptionForAdminBodyDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  email: string;
}

export class changeSubscriptionBodyDto {
  @IsString()
  @IsNotEmpty()
  productId: string;
}

export class createPaymentReturnDto {
  success: boolean;
  url: string;
}

export class createSubscriptionReturnDto {
  success: boolean;
  url: string;
}
