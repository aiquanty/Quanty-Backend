import {
  Injectable,
  InternalServerErrorException,
  PreconditionFailedException,
} from '@nestjs/common';
import { Model } from 'mongoose';

import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Admin, AdminDocument } from './admins.schema';
import { Response as ResponseType } from 'express';
import { successMessageDto } from 'app.dto';
import {
  LoginAdminDto,
  cancelAnyUserSubscriptionInputDto,
  createAdminDto,
  giveUserFreeProductSubscriptionInputDto,
} from './dtos/admins.dto';
import { UsersService } from 'src/users/users.service';
import { PaymentService } from 'src/payment/payment.service';
@Injectable()
export class AdminsService {
  constructor(
    @InjectModel(Admin.name)
    private readonly adminModel: Model<AdminDocument>,
    private readonly jwtService: JwtService,
    private readonly UsersService: UsersService,
    private readonly PaymentService: PaymentService,
  ) {}

  async setPassword(admin: Admin, password: string): Promise<void> {
    admin.salt = crypto.randomBytes(256).toString('hex');
    admin.hash = crypto
      .pbkdf2Sync(password, admin.salt, 100000, 512, 'sha512')
      .toString('hex');
  }

  async validPassword(admin: Admin, password: string): Promise<boolean> {
    const hash = crypto.pbkdf2Sync(password, admin.salt, 100000, 512, 'sha512');
    const storedHash = Buffer.from(admin.hash, 'hex');
    return crypto.timingSafeEqual(storedHash, hash);
  }

  async generateJwt(admin: AdminDocument): Promise<string> {
    try {
      const payload = {
        _id: admin._id,
        email: admin.email,
      };
      return this.jwtService.sign(payload);
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async login(admin: AdminDocument, res: ResponseType): Promise<LoginAdminDto> {
    try {
      const token = await this.generateJwt(admin);
      res.cookie('token', token, {
        expires: new Date(Date.now() + 3600 * 24 * 5),
      });

      return {
        token: token,
        email: admin.email,
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async getAdminByEmail(email: string): Promise<AdminDocument> {
    try {
      return await this.adminModel.findOne({ email: email });
    } catch (err) {
      throw err;
    }
  }

  async getLoggedInUser(email: string): Promise<AdminDocument> {
    try {
      return await this.adminModel.findOne({ email: email }, 'name email');
    } catch (err) {
      throw err;
    }
  }

  async createAdmin(adminBody: createAdminDto): Promise<successMessageDto> {
    try {
      const existingAdmin = await this.getAdminByEmail(adminBody.email);
      if (existingAdmin) {
        throw new PreconditionFailedException({
          success: false,
          message: 'email already exists',
        });
      }
      var admin = new Admin();
      admin.email = adminBody.email;
      admin.name = adminBody.name;
      await this.setPassword(admin, adminBody.password);
      await this.adminModel.create(admin);
      return {
        success: true,
        message: 'Admin created successfully',
      };
    } catch (err) {
      throw err;
    }
  }

  async giveUserFreeProductSubscription(
    userBody: giveUserFreeProductSubscriptionInputDto,
  ): Promise<successMessageDto> {
    try {
      const user = await this.UsersService.getUserByEmail(userBody.email);
      if (!user) {
        throw new PreconditionFailedException({
          success: false,
          message: 'No user found with this email',
        });
      }
      user.productId = userBody.productId;
      user.freeSubscription = true;
      await user.save();
      return {
        success: true,
        message: 'User subscribed successfully',
      };
    } catch (err) {
      throw err;
    }
  }

  async cancelAnyUserSubscription(
    userBody: cancelAnyUserSubscriptionInputDto,
  ): Promise<successMessageDto> {
    try {
      const user = await this.UsersService.getUserByEmail(userBody.email);
      if (!user) {
        throw new PreconditionFailedException({
          success: false,
          message: 'No user found with this email',
        });
      }
      const cancelSub = await this.PaymentService.cancelSubscription({
        email: user.email,
        _id: user._id,
      });
      if (cancelSub.success) {
        return {
          success: true,
          message: 'User subscription canceled successfully',
        };
      }
      return {
        success: false,
        message: cancelSub.message,
      };
    } catch (err) {
      throw err;
    }
  }
}
