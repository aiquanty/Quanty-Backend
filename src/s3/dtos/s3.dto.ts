import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class successMessageDto {
  success: Boolean;
  message: string;
}
export class getFileDto {
  @IsString()
  @IsNotEmpty()
  filename: string;
  @IsNumber()
  @IsNotEmpty()
  fileIndex: number;
  @IsString()
  @IsNotEmpty()
  collectionName: string;
}

export class getBlogImageInputDto {
  @IsString()
  @IsNotEmpty()
  image: string;
}
