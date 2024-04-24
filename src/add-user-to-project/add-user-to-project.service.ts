import {
  Injectable,
  InternalServerErrorException,
  PreconditionFailedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { successMessageDto } from 'app.dto';
import { JwtPayloadDto } from 'src/auth/dtos/auth-jwt.dto';
import { MailService } from 'src/mail/mail.service';
import { UserDocument } from 'src/users/users.schema';
import { UsersService } from 'src/users/users.service';
import {
  emailInvitationLinkForTeamMemberInputDto,
  getInvitedUserReturnDto,
} from './dtos/add-user-to-project.dto';

@Injectable()
export class AddUserToProjectService {
  constructor(
    private readonly UsersService: UsersService,
    private readonly MailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  async generateJwt(user: UserDocument, emailToAdd: string): Promise<string> {
    try {
      const payload = {
        _id: user._id,
        email: user.email,
        emailToAdd: emailToAdd,
      };
      return this.jwtService.sign(payload);
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }
  async emailInvitationLinkForTeamMember(
    authBody: JwtPayloadDto,
    teamMemberBody: emailInvitationLinkForTeamMemberInputDto,
  ): Promise<successMessageDto> {
    try {
      const user = await this.UsersService.getUserByEmail(authBody.email);
      if (user.role !== 'owner') {
        throw new PreconditionFailedException({
          success: false,
          message: 'Only owner can add team members',
        });
      }
      if (user.email === teamMemberBody.email) {
        throw new PreconditionFailedException({
          success: false,
          message: 'Email is already linked',
        });
      }
      if (user.accountDetails.teamMembers) {
        for (const teamMemberId of user.accountDetails.teamMembers) {
          const member = await this.UsersService.getUserById(teamMemberId);
          if (member.email === teamMemberBody.email) {
            throw new PreconditionFailedException({
              success: false,
              message: 'Email is already linked',
            });
          }
        }
      }
      const existingUser = await this.UsersService.getUserByEmail(
        teamMemberBody.email,
      );
      if (existingUser && existingUser.role !== 'none') {
        throw new PreconditionFailedException({
          success: false,
          message: 'Email is already linked to another account',
        });
      }
      var link = '';
      if (existingUser) {
        link = '/login';
      } else {
        link = '/signup';
      }
      const token = await this.generateJwt(user, teamMemberBody.email);
      await this.MailService.sendAddUserToProjectMail(
        teamMemberBody.email,
        user.name,
        token,
        link,
      );
      return {
        success: true,
        message: 'Email sent successfully',
      };
    } catch (err) {
      console.log(err);
      return {
        success: false,
        message: 'Something went wrong',
      };
    }
  }
  async getInvitedUser(user): Promise<getInvitedUserReturnDto> {
    try {
      const existingUser = await this.UsersService.getUserByEmail(
        user.emailToAdd,
      );
      if (existingUser) {
        return {
          success: true,
          email: user.emailToAdd,
          exists: true,
        };
      } else {
        return {
          success: true,
          email: user.emailToAdd,
          exists: false,
        };
      }
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async addUserToProject(user): Promise<successMessageDto> {
    try {
      const existingUser = await this.UsersService.getUserByEmail(
        user.emailToAdd,
      );
      if (existingUser) {
        const owner = await this.UsersService.getUserByEmail(user.email);
        if (!owner) {
          return {
            success: false,
            message: 'Something went wrong. Please contact support',
          };
        }
        owner.accountDetails.teamMembers.push(existingUser._id.toString());

        existingUser.ownerId = owner._id;
        existingUser.role = 'user';
        await existingUser.save();
        await owner.save();
        return {
          success: true,
          message: 'User added successfully',
        };
      } else {
        return {
          success: false,
          message: 'No user found',
        };
      }
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
