import {
  Inject,
  Injectable,
  PreconditionFailedException,
  forwardRef,
} from '@nestjs/common';

import { Stripe } from 'stripe';
import { Model } from 'mongoose';
import {
  createProductBodyDto,
  deleteProductBodyDto,
  editProductBodyDto,
} from './dtos/products.dto';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import { UsersService } from 'src/users/users.service';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './products.schema';
import { successMessageDto } from 'app.dto';
import { JwtPayloadDto } from 'src/auth/dtos/auth-jwt.dto';
import { PaymentService } from 'src/payment/payment.service';
@Injectable()
export class ProductsService {
  private stripe: Stripe;
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly UsersService: UsersService,
    @Inject(forwardRef(() => PaymentService))
    private readonly PaymentService: PaymentService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }

  async getAllProductsForUser(
    userBody: JwtPayloadDto,
  ): Promise<ProductDocument[]> {
    try {
      const user = await this.UsersService.getUserByEmail(userBody.email);

      const allUserProducts = await this.getAllFilteredProducts('-stripe');
      const customUserProducts = await this.productModel.find(
        {
          custom: true,
          availableToUsers: { $in: user._id },
        },
        '-stripe',
      );
      return allUserProducts.concat(customUserProducts);
    } catch (err) {
      throw err;
    }
  }
  async getAllFilteredProducts(
    filterQuery: string,
  ): Promise<ProductDocument[]> {
    try {
      return await this.productModel.find(
        { custom: { $ne: true } },
        filterQuery,
      );
    } catch (err) {
      throw err;
    }
  }

  async getAllFilteredCustomProducts(
    filterQuery: string,
  ): Promise<ProductDocument[]> {
    try {
      return await this.productModel.find(
        { custom: { $eq: true } },
        filterQuery,
      );
    } catch (err) {
      throw err;
    }
  }

  async getProductById(id: string): Promise<ProductDocument> {
    try {
      return await this.productModel.findOne({
        _id: id,
      });
    } catch (err) {
      throw err;
    }
  }

  async getProductByStripeProductId(id: string): Promise<ProductDocument> {
    try {
      return await this.productModel.findOne({
        'stripe.productId': id,
      });
    } catch (err) {
      throw err;
    }
  }
  async createProduct(
    createProductBody: createProductBodyDto,
  ): Promise<successMessageDto> {
    try {
      const existingProduct = await this.productModel.findOne({
        name: createProductBody.productName,
      });
      if (existingProduct) {
        throw new PreconditionFailedException({
          success: false,
          message: 'Product name already exists',
        });
      }
      const product = await this.stripe.products.create({
        name: createProductBody.productName,
      });
      const price = await this.stripe.prices.create({
        product: product.id,
        unit_amount: createProductBody.productPrice * 100,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
      });
      const newProduct: Product = {
        name: createProductBody.productName,
        price: createProductBody.productPrice,
        stripe: {
          priceId: price.id,
          productId: product.id,
        },
        allowedCredits: createProductBody.allowedCredits,
        allowedTeamMembers: createProductBody.allowedTeamMembers,
        allowedAssistants: createProductBody.allowedAssistants,
        custom: createProductBody.custom,
        availableToUsers: [],
      };
      await this.productModel.create(newProduct);
      return {
        success: true,
        message: 'Product created successfully',
      };
    } catch (err) {
      throw err;
    }
  }

  async editProduct(
    editProductBody: editProductBodyDto,
  ): Promise<successMessageDto> {
    try {
      const product = await this.getProductById(editProductBody.productId);
      const allProducts = await this.productModel.find({});
      allProducts.forEach((individualProduct) => {
        if (
          individualProduct._id.toString() !== product._id.toString() &&
          individualProduct.name === editProductBody.productName
        ) {
          throw new PreconditionFailedException({
            success: false,
            message: 'Product name already exists',
          });
        }
      });
      if (product.price !== editProductBody.productPrice) {
        const updatePrice = await this.stripe.prices.create({
          product: product.stripe.productId,
          unit_amount: editProductBody.productPrice * 100,
          currency: 'usd',
          recurring: {
            interval: 'month',
          },
        });

        await this.stripe.prices.update(product.stripe.priceId, {
          active: false,
        });

        product.stripe.priceId = updatePrice.id;

        product.price = editProductBody.productPrice;
        product.custom = editProductBody.custom;
        const users = await this.UsersService.getPayingUsersForProductId(
          product._id,
        );
        const promises = users.map(async (user) => {
          const currentSubscription = await this.stripe.subscriptions.retrieve(
            user.stripe.subscriptionId,
          );
          return this.stripe.subscriptionItems.update(
            currentSubscription.items.data[0].id,
            {
              price: product.stripe.priceId,
            },
          );
        });

        await Promise.all(promises);
      }

      await this.stripe.products.update(product.stripe.productId, {
        name: editProductBody.productName,
      });

      product.allowedAssistants = editProductBody.allowedAssistants;
      product.allowedTeamMembers = editProductBody.allowedTeamMembers;
      product.allowedCredits = editProductBody.allowedCredits;
      product.name = editProductBody.productName;
      await product.save();
      return {
        success: true,
        message: 'Product updated successfully',
      };
    } catch (err) {
      throw err;
    }
  }
  async deleteProduct(
    deleteProductBody: deleteProductBodyDto,
  ): Promise<successMessageDto> {
    try {
      const product = await this.getProductById(deleteProductBody.productId);
      if (!product) {
        throw new PreconditionFailedException({
          success: false,
          message: 'Product not found',
        });
      }
      const users = await this.UsersService.getUsersByProductId(
        deleteProductBody.productId,
      );
      console.log(users);
      for (const user of users) {
        const cancelSub = await this.PaymentService.cancelSubscription({
          email: user.email,
          _id: user._id,
        });
        if (!cancelSub.success) {
          throw new PreconditionFailedException({
            success: false,
            message: 'Could not unsubscribe all users from this product',
          });
        }
      }
      await this.stripe.products.update(product.stripe.productId, {
        active: false,
      });
      await this.productModel.deleteOne({
        _id: product._id,
      });
      return {
        success: true,
        message: 'Product deleted successfully',
      };
    } catch (err) {
      throw err;
    }
  }
}
