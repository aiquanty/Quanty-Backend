import { Module } from '@nestjs/common';
import { PasswordService } from './password.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: process.env.FORGOT_PASSWORD_AUTH_KEY,
      signOptions: { expiresIn: '5m' },
    }),
  ],
  providers: [PasswordService],
  exports: [PasswordService],
})
export class PasswordModule {}
