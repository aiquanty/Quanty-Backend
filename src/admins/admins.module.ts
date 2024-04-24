import { Module } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, AdminSchema } from './admins.schema';
import { UsersModule } from 'src/users/users.module';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
  imports: [
    UsersModule,
    PaymentModule,
    JwtModule.register({
      secret: process.env.ADMIN_AUTH_KEY,
    }),
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
  ],
  providers: [AdminsService],
  exports: [AdminsService],
})
export class AdminsModule {}
