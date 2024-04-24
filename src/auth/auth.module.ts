import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { AdminsStrategy, UsersStrategy } from './strategies/local.strategy';
import { PassportModule } from '@nestjs/passport';
import {
  JwtAddUserToProjectStrategy,
  JwtAdminStrategy,
  JwtForgotPassowrdStrategy,
  JwtStrategy,
} from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { AdminsModule } from 'src/admins/admins.module';
@Module({
  imports: [UsersModule, PassportModule, AdminsModule],
  providers: [
    AuthService,
    UsersStrategy,
    JwtStrategy,
    JwtForgotPassowrdStrategy,
    JwtAddUserToProjectStrategy,
    GoogleStrategy,
    JwtAdminStrategy,
    AdminsStrategy,
  ],
  exports: [
    AuthService,
    UsersStrategy,
    JwtStrategy,
    JwtForgotPassowrdStrategy,
    JwtAddUserToProjectStrategy,
    GoogleStrategy,
  ],
})
export class AuthModule {}
