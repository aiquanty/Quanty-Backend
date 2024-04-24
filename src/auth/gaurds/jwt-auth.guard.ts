import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
export class JwtAdminAuthGuard extends AuthGuard('jwt_admin_strategy') {}
export class JwtForgotPassowrdAuthGuard extends AuthGuard(
  'forgot-password-jwt',
) {}

export class JwtAddUserToProjectAuthGuard extends AuthGuard(
  'add-user-to-project-jwt',
) {}
