import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { UsersModule } from 'src/users/users.module';
import { ProductsModule } from 'src/products/products.module';

@Module({
  imports: [UsersModule, ProductsModule],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
