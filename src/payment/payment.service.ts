import {
  Injectable,
  InternalServerErrorException,
  PreconditionFailedException,
} from '@nestjs/common';
import { Stripe } from 'stripe';

import {
  PaymentRequestBody,
  changeSubscriptionBodyDto,
  createPaymentReturnDto,
  createSubscriptionBodyDto,
  createSubscriptionForAdminBodyDto,
  createSubscriptionReturnDto,
} from './dtos/payment.dto';
import { UsersService } from 'src/users/users.service';
import { JwtPayloadDto } from 'src/auth/dtos/auth-jwt.dto';
import { ProductsService } from 'src/products/products.service';
import { successMessageDto } from 'app.dto';
@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private readonly UsersService: UsersService,
    private readonly ProductsService: ProductsService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }

  async createPayment(
    userJwtPayload: JwtPayloadDto,
    paymentRequestBody: PaymentRequestBody,
  ): Promise<createPaymentReturnDto> {
    try {
      const user = await this.UsersService.getUserByEmail(userJwtPayload.email);
      if (!user.stripe.customerId) {
        const customer = await this.stripe.customers.create({
          name: user.name,
          email: user.email,
        });
        user.stripe.customerId = customer.id;
        await user.save();
      }
      if (!user.stripe.customerId) {
        throw new PreconditionFailedException({
          success: false,
          message: 'Could not create a payment session for the user',
        });
      }

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer: user.stripe.customerId,
        success_url: process.env.SUCCESSFUL_STRIPE_CALLBACK_URL,
        cancel_url: process.env.CANCEL_STRIPE_CALLBACK_URL,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: paymentRequestBody.title,
              },
              unit_amount: Number((paymentRequestBody.price * 100).toFixed(0)),
            },
            quantity: paymentRequestBody.quantity,
          },
        ],
        payment_method_collection: 'if_required',
      });
      return {
        success: true,
        url: session.url,
      };
    } catch (err) {
      console.log(err);
      return {
        success: false,
        url: '',
      };
    }
  }

  async createSubscription(
    userJwtPayload: JwtPayloadDto,
    createSubscriptionBody: createSubscriptionBodyDto,
  ): Promise<createSubscriptionReturnDto> {
    try {
      const user = await this.UsersService.getUserByEmail(userJwtPayload.email);

      const product = await this.ProductsService.getProductById(
        createSubscriptionBody.productId,
      );
      if (!product) {
        throw new PreconditionFailedException({
          success: false,
          message: 'Product not found',
        });
      }
      if (!user.stripe.customerId) {
        const customer = await this.stripe.customers.create({
          name: user.name,
          email: user.email,
        });
        user.stripe.customerId = customer.id;
        await user.save();
      }
      if (!user.stripe.customerId) {
        throw new PreconditionFailedException({
          success: false,
          message: 'Could not create a payment session for the user',
        });
      }

      const subscription = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer: user.stripe.customerId,
        success_url: process.env.SUCCESSFUL_STRIPE_CALLBACK_URL,
        cancel_url: process.env.CANCEL_STRIPE_CALLBACK_URL,
        payment_method_collection: 'if_required',
        line_items: [
          {
            price: product.stripe.priceId,
            quantity: 1,
          },
        ],
      });

      return {
        success: true,
        url: subscription.url,
      };
    } catch (err) {
      console.log(err);
      return {
        success: false,
        url: '',
      };
    }
  }

  async createSubscriptionForAdmin(
    createSubscriptionForAdminBody: createSubscriptionForAdminBodyDto,
  ): Promise<successMessageDto> {
    try {
      const user = await this.UsersService.getUserByEmail(
        createSubscriptionForAdminBody.email,
      );
      if (!user) {
        throw new PreconditionFailedException({
          success: false,
          message: 'No user found',
        });
      }
      // if (user.role !== 'none') {
      //   throw new PreconditionFailedException({
      //     success: false,
      //     message: 'User already linked to a product',
      //   });
      // }
      const product = await this.ProductsService.getProductById(
        createSubscriptionForAdminBody.productId,
      );
      if (!product) {
        throw new PreconditionFailedException({
          success: false,
          message: 'Product not found',
        });
      }
      if (product.availableToUsers.includes(user._id)) {
        throw new PreconditionFailedException({
          success: false,
          message: 'User already linked to product',
        });
      }
      product.availableToUsers.push(user._id);
      await product.save();

      return {
        success: true,
        message: 'Product is available for user',
      };
    } catch (err) {
      throw err;
    }
  }
  async changeSubscription(
    userJwtPayload: JwtPayloadDto,
    changeSubscriptionBody: changeSubscriptionBodyDto,
  ): Promise<successMessageDto> {
    try {
      const user = await this.UsersService.getUserByEmail(userJwtPayload.email);
      if (user.role !== 'owner') {
        throw new PreconditionFailedException({
          success: false,
          message: 'Only owner is allowed to manage subscriptions',
        });
      }
      if (!user.stripe.subscriptionId) {
        if (user.freeSubscription) {
          throw new PreconditionFailedException({
            success: false,
            message: 'Contact admin for change of subscription',
          });
        }
        throw new PreconditionFailedException({
          success: false,
          message: 'No subscription found for the user',
        });
      }
      const product = await this.ProductsService.getProductById(
        changeSubscriptionBody.productId,
      );
      if (!product) {
        throw new PreconditionFailedException({
          success: false,
          message: 'Product not found',
        });
      }
      const currentSubscription = await this.stripe.subscriptions.retrieve(
        user.stripe.subscriptionId,
      );
      await this.stripe.subscriptionItems.update(
        currentSubscription.items.data[0].id,
        {
          price: product.stripe.priceId,
        },
      );
      user.productId = product._id;
      user.freeSubscription = false;
      user.accountDetails.allowedTeamMembers = product.allowedTeamMembers;
      user.accountDetails.allowedCredits = product.allowedCredits;
      user.accountDetails.allowedAssistants = product.allowedAssistants;
      await user.save();
      return {
        success: true,
        message: 'Successfully updated subscription',
      };
    } catch (err) {
      throw err;
    }
  }

  async cancelSubscription(
    userJwtPayload: JwtPayloadDto,
  ): Promise<successMessageDto> {
    try {
      const user = await this.UsersService.getUserByEmail(userJwtPayload.email);
      if (user.role !== 'owner') {
        throw new PreconditionFailedException({
          success: false,
          message: 'Only owner is allowed to manage subscriptions',
        });
      }
      if (!user.stripe.subscriptionId && !user.freeSubscription) {
        throw new PreconditionFailedException({
          success: false,
          message: 'No subscription found for the user',
        });
      }
      if (user.freeSubscription) {
        user.freeSubscription = false;
        await user.save();
        await this.UsersService.removeProductIdFromUser(user._id);
        return {
          success: true,
          message: 'Successfully cancelled subscription',
        };
      } else {
        const subscription = await this.stripe.subscriptions.cancel(
          user.stripe.subscriptionId,
        );
        if (subscription.status === 'canceled') {
          await this.UsersService.removeSubscriptionFromUser(user._id);

          return {
            success: true,
            message: 'Successfully cancelled subscription',
          };
        }
      }

      return {
        success: false,
        message: 'Something went wrong. Please try again later',
      };
    } catch (err) {
      throw err;
    }
  }
  // Will use stripe webhook here and will rework this
  async stripeWebhook(webhookBody, stripeSignature: string) {
    try {
      const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

      let event = this.stripe.webhooks.constructEvent(
        webhookBody.rawBody,
        stripeSignature,
        endpointSecret,
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntentSucceeded = event.data.object;
          if (paymentIntentSucceeded.status !== 'succeeded') {
            console.log(
              'Did not find an customer for the payment id : ' +
                paymentIntentSucceeded.id +
                ' for the ammount : ' +
                paymentIntentSucceeded.amount / 100 +
                ' for the Customer : ' +
                paymentIntentSucceeded.customer +
                'has the status' +
                paymentIntentSucceeded.status +
                ' event body : ' +
                webhookBody.rawBody,
            );
            throw new PreconditionFailedException({
              success: false,
              message: 'Invalid status',
            });
          }
          // const amount = paymentIntentSucceeded.amount / 100;

          if (!paymentIntentSucceeded.customer) {
            console.log('No customer id found for the event', event);
            throw new PreconditionFailedException({
              success: false,
              message: 'No customer id found for the event',
            });
          }
          const user = await this.UsersService.getUserByStripeCustomerId(
            paymentIntentSucceeded.customer.toString(),
          );
          if (!user.email) {
            console.log('No user found for the customer', event);
            throw new PreconditionFailedException({
              success: false,
              message: 'No user found for the customer id',
            });
          }

          await user.save();
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          const subscriptionCreated = event.data.object;
          if (!subscriptionCreated.customer) {
            console.log('No customer id found for the event', event);
            throw new PreconditionFailedException({
              success: false,
              message: 'No customer id found for the event',
            });
          }

          const userForSub = await this.UsersService.getUserByStripeCustomerId(
            subscriptionCreated.customer.toString(),
          );
          if (!userForSub.email) {
            console.log('No user found for the customer', event);
            throw new PreconditionFailedException({
              success: false,
              message: 'No user found for the customer id',
            });
          }
          const product =
            await this.ProductsService.getProductByStripeProductId(
              subscriptionCreated.items.data[0].price.product.toString(),
            );
          userForSub.stripe.subscriptionId = subscriptionCreated.id;
          userForSub.productId = product._id;
          userForSub.role = 'owner';
          userForSub.accountDetails.allowedTeamMembers =
            product.allowedTeamMembers;
          userForSub.accountDetails.allowedCredits = product.allowedCredits;
          userForSub.accountDetails.usedCredits = 0;
          userForSub.accountDetails.allowedAssistants =
            product.allowedAssistants;
          userForSub.markModified('accountDetails');
          await userForSub.save();

          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      return {
        success: true,
        message: 'Payment Status Updated Successfully',
      };
    } catch (err) {
      throw err;
    }
  }
}
