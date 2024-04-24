import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class createProductBodyDto {
  @IsString()
  @IsNotEmpty()
  productName: string;
  @IsNumber()
  @IsNotEmpty()
  productPrice: number;

  @IsNumber()
  allowedTeamMembers: number;

  @IsNumber()
  allowedCredits: number;

  @IsNumber()
  allowedAssistants: number;

  @IsBoolean()
  @IsNotEmpty()
  custom: boolean;
}

export class editProductBodyDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsNumber()
  @IsNotEmpty()
  productPrice: number;

  @IsNumber()
  allowedTeamMembers: number;

  @IsNumber()
  allowedCredits: number;

  @IsNumber()
  allowedAssistants: number;

  @IsBoolean()
  @IsNotEmpty()
  custom: boolean;
}

export class deleteProductBodyDto {
  @IsString()
  @IsNotEmpty()
  productId: string;
}
