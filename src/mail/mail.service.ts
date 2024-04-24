import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { sendUserQueryInputDto } from './dtos/mail.dto';
@Injectable()
export class MailService {
  constructor() {}

  async sendForgotPasswordMail(email: string, name: string, token: string) {
    try {
      const url = `${process.env.FORGOT_PASSWORD_CALLBACK_URL}/?token=${token}`;
      const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: false,
        tls: {
          rejectUnauthorized: false,
        },
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      });
      const sendMail = await transporter.sendMail({
        to: email,
        from: process.env.MAIL_USER,
        subject: 'Reset Password',
        html: `<p>Hello ${name},</p>
        <p>Please click the below link to reset your password</p>
        <p>
          <a href='${url}'>Reset Password</a>
        </p>
        
        <p>If you did not request this email you can safely ignore it.</p>`,
      });
      console.log(sendMail);
    } catch (err) {
      console.log('here', err);
      throw err;
    }
  }

  async sendAddUserToProjectMail(
    email: string,
    name: string,
    token: string,
    link: string,
  ) {
    try {
      const url = `${
        process.env.ADD_USER_TO_PROJECT_CALLBACK_URL + link
      }/?token=${token}`;

      const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: false,
        tls: {
          rejectUnauthorized: false,
        },
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      });

      const sendMail = await transporter.sendMail({
        to: email,
        from: process.env.MAIL_USER,
        subject: 'Invitation link to join project',
        html: `<p>Invitation from ${name}</p>
        <p>Please click the below link to join the project</p>
        <p>
          <a href='${url}'>Join Project</a>
        </p>
        
        <p>If you did not request this email you can safely ignore it.</p>`,
      });
    } catch (err) {
      throw err;
    }
  }

  async sendUserQuery(userQueryDetails: sendUserQueryInputDto) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: false,
        tls: {
          rejectUnauthorized: false,
        },
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      });

      const sendMail = await transporter.sendMail({
        to: process.env.QUERY_MAIL,
        from: process.env.MAIL_USER,
        subject: `Quanty user query from ${userQueryDetails.name}`,
        html: `
        <p>Name : ${userQueryDetails.name}</p>
        
        <p>Email : ${userQueryDetails.email}</p>

        <p>Query : ${userQueryDetails.query}</p>

      
       `,
      });
    } catch (err) {
      throw err;
    }
  }
}
