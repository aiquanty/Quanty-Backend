import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './users.schema';
import { MailModule } from 'src/mail/mail.module';
import { S3Module } from 'src/s3/s3.module';
require('dotenv').config();
@Module({
  imports: [
    MailModule,
    JwtModule.register({
      secret: process.env.USER_AUTH_KEY,
      signOptions: { expiresIn: '10d' },
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    S3Module,
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
