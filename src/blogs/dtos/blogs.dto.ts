import {
  IsArray,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsString,
} from 'class-validator';
import { BlogsDocument } from '../blogs.schema';

export class createBlogInputDto {
  @IsString()
  @IsNotEmpty()
  title: string;
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class editBlogDetailsInputDto {
  @IsString()
  @IsNotEmpty()
  _id: string;
  @IsString()
  @IsNotEmpty()
  title: string;
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class editBlogTitleImageInputDto {
  @IsString()
  @IsNotEmpty()
  _id: string;
}

export class editBlogDetailsImageInputDto {
  @IsString()
  @IsNotEmpty()
  _id: string;
}

export class deleteBlogInputDto {
  @IsString()
  @IsNotEmpty()
  _id: string;
}

export class getAllBlogsReturnDto {
  success: boolean;
  blogs: BlogsDocument[];
}

export class getBlogReturnDto {
  success: boolean;
  blog: BlogsDocument;
}

export class getBlogInputDto {
  @IsString()
  @IsNotEmpty()
  _id: string;
}

export class getBlogByTitleInputDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}
