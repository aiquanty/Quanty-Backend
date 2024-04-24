import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from 'src/users/users.schema';
import { Admin } from 'src/admins/admins.schema';

@Injectable()
export class UsersStrategy extends PassportStrategy(Strategy, 'users-local') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<User> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}

@Injectable()
export class AdminsStrategy extends PassportStrategy(Strategy, 'admins-local') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<Admin> {
    const admin = await this.authService.validateAdmin(email, password);
    if (!admin) {
      throw new UnauthorizedException();
    }
    return admin;
  }
}
