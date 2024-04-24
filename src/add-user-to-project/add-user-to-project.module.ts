import { Module } from '@nestjs/common';
import { AddUserToProjectService } from './add-user-to-project.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    UsersModule,
    MailModule,
    JwtModule.register({
      secret: process.env.ADD_USER_TO_PROJECT_AUTH_KEY,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AddUserToProjectService],
  exports: [AddUserToProjectService],
})
export class AddUserToProjectModule {}
