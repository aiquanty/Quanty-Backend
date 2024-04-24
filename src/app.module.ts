import { Module } from '@nestjs/common';
import { AppController } from './app.controller';

import { databaseProviders } from './config/db';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PdfService } from './pdf/pdf.service';
import { PdfModule } from './pdf/pdf.module';
import { S3Module } from './s3/s3.module';
import { MailModule } from './mail/mail.module';
import { PasswordModule } from './password/password.module';
import { PaymentModule } from './payment/payment.module';
import { ProductsModule } from './products/products.module';
import { AdminsModule } from './admins/admins.module';
import { AddUserToProjectModule } from './add-user-to-project/add-user-to-project.module';
import { BlogsModule } from './blogs/blogs.module';
@Module({
  imports: [
    ...databaseProviders,
    AuthModule,
    UsersModule,
    PdfModule,
    S3Module,
    MailModule,
    PasswordModule,
    PaymentModule,
    ProductsModule,
    AdminsModule,
    AddUserToProjectModule,
    BlogsModule,
  ],

  controllers: [AppController],
  providers: [PdfService],
})
export class AppModule {}
