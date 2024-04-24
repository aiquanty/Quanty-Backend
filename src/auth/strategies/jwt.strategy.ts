import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayloadDto } from '../dtos/auth-jwt.dto';
import { Request as RequestType } from 'express';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.ExtractJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: process.env.USER_AUTH_KEY,
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayloadDto): JwtPayloadDto {
    return payload;
  }

  private static ExtractJWT(req: RequestType): string | null {
    if (req.cookies && 'token' in req.cookies && req.cookies.token.length > 0) {
      return req.cookies.token;
    }
    return null;
  }
}

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(
  Strategy,
  'jwt_admin_strategy',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtAdminStrategy.ExtractJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: process.env.ADMIN_AUTH_KEY,
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayloadDto): JwtPayloadDto {
    return payload;
  }

  private static ExtractJWT(req: RequestType): string | null {
    if (req.cookies && 'token' in req.cookies && req.cookies.token.length > 0) {
      return req.cookies.token;
    }
    return null;
  }
}

@Injectable()
export class JwtForgotPassowrdStrategy extends PassportStrategy(
  Strategy,
  'forgot-password-jwt',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.FORGOT_PASSWORD_AUTH_KEY,
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayloadDto): JwtPayloadDto {
    return payload;
  }
}

@Injectable()
export class JwtAddUserToProjectStrategy extends PassportStrategy(
  Strategy,
  'add-user-to-project-jwt',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.ADD_USER_TO_PROJECT_AUTH_KEY,
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayloadDto): JwtPayloadDto {
    return payload;
  }
}
