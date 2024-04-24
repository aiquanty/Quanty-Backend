import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ collection: 'products' })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop()
  price: number;

  @Prop()
  allowedTeamMembers: number;

  @Prop()
  allowedCredits: number;

  @Prop()
  allowedAssistants: number;

  @Prop(
    raw({
      productId: String,
      priceId: String,
    }),
  )
  stripe: {
    productId: string;
    priceId: string;
  };

  @Prop({ default: false })
  custom: boolean;

  @Prop({ default: [] })
  availableToUsers: string[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
