import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlogsDocument = Blogs & Document;

@Schema({ collection: 'Blogs' })
export class Blogs {
  @Prop({ required: true, unique: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  image: string;
}

export const BlogsSchema = SchemaFactory.createForClass(Blogs);
