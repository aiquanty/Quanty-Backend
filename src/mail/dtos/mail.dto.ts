import { IsNotEmpty, IsString } from 'class-validator';

export class sendUserQueryInputDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsNotEmpty()
  email: string;
  @IsString()
  @IsNotEmpty()
  query: string;
}
