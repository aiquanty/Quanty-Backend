import { IsNotEmpty } from 'class-validator';

export class JwtPayloadDto {
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  _id: string;
}
