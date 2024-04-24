import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ collection: 'users' })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  hash: string;

  @Prop()
  salt: string;

  @Prop()
  name: string;

  @Prop()
  businessName: string;

  @Prop()
  phone: string;

  @Prop(
    raw({
      allowedCredits: Number,
      allowedTeamMembers: Number,
      usedCredits: Number,
      allowedAssistants: Number,
      teamMembers: [String],
    }),
  )
  accountDetails: {
    allowedCredits: number;
    usedCredits: number;
    allowedTeamMembers: number;
    allowedAssistants: number;
    teamMembers: string[];
  };

  @Prop()
  ownerId: string;

  @Prop({ default: 'none' })
  role: string;

  @Prop({ default: [] })
  collections: {
    name: string;
    readAccess: string[];
    writeAccess: string[];
    noOfPages: number;
    projects: {
      name: string;
      id: number;
      type: string;
      description: string;
      model: string;
      language: string;
      dataAnomiyzer: boolean;
      sourceChatGpt: boolean;
      bestGuess: number;
      urls: string[];
      file: string;
      date: Date
    }[];
  }[];

  @Prop(
    raw({
      customerId: String,
      subscriptionId: String,
    }),
  )
  stripe: {
    customerId: string;
    subscriptionId: string;
  };

  @Prop()
  productId: string;

  @Prop({ default: false })
  freeSubscription: boolean;

  @Prop({ default: '' })
  profileImage: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
