import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminDocument = Admin & Document;

@Schema({ collection: 'admins' })
export class Admin {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  hash: string;

  @Prop()
  salt: string;

  @Prop()
  name: string;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
