import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from 'src/users/users.schema';
import { AdminsService } from 'src/admins/admins.service';
import { Admin } from 'src/admins/admins.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private adminsService: AdminsService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.getUserByEmail(email);
    if (!user || !(await this.usersService.validPassword(user, password))) {
      return null;
    }

    return user;
  }

  async validateAdmin(email: string, password: string): Promise<Admin> {
    const admin = await this.adminsService.getAdminByEmail(email);
    if (!admin || !(await this.adminsService.validPassword(admin, password))) {
      return null;
    }

    return admin;
  }
}
