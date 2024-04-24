import {
  Injectable,
  PreconditionFailedException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  forgotPasswordInputDto,
  resetPasswordInputDto,
} from './dtos/password.dto';
import { successMessageDto } from 'app.dto';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/mail.service';
import { JwtPayloadDto } from 'src/auth/dtos/auth-jwt.dto';
import { UserDocument } from 'src/users/users.schema';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PasswordService {
  constructor(
    private readonly UsersService: UsersService,
    private readonly MailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  async generateJwt(user: UserDocument): Promise<string> {
    try {
      const payload = {
        _id: user._id,
        email: user.email,
      };
      return this.jwtService.sign(payload);
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async forgotPassword(
    forgotPasswordBody: forgotPasswordInputDto,
  ): Promise<successMessageDto> {
    try {
      const user = await this.UsersService.getUserByEmail(
        forgotPasswordBody.email,
      );
      if (user && Object.entries(user).length !== 0) {
        const token = await this.generateJwt(user);
        await this.MailService.sendForgotPasswordMail(
          user.email,
          user.name,
          token,
        );
        return {
          success: true,
          message: 'Email send successfully',
        };
      } else {
        throw new PreconditionFailedException({
          success: false,
          message: 'No user with this email',
        });
      }
    } catch (err) {
      throw err;
    }
  }

  async resetPassword(
    payload: JwtPayloadDto,
    newPasswordBody: resetPasswordInputDto,
  ): Promise<successMessageDto> {
    try {
      const user = await this.UsersService.getUserByEmail(payload.email);
      if (user) {
        await this.UsersService.setPassword(user, newPasswordBody.newPassword);
        user.save();
        return {
          success: true,
          message: 'Password Reset Successfully',
        };
      } else {
        throw new PreconditionFailedException({
          success: false,
          message: 'No user found with this email',
        });
      }
    } catch (err) {
      throw err;
    }
  }
}
