import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export class UsersAuthGuard extends AuthGuard('users-local') {}

export class AdminsAuthGuard extends AuthGuard('admins-local') {}
