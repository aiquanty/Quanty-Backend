import { Module, forwardRef } from '@nestjs/common';
import { ProductsService } from './products.service';
import { UsersModule } from 'src/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './products.schema';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => PaymentModule),
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
