import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth2';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLINET_SECRET,
      callbackURL: process.env.CALL_BACK_URL,
      scope: ['profile', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, name, emails, displayName } = profile;

      const user = {
        type: 'googleUser',
        googleId: id,
        username: displayName,
        email: emails[0].value,
        firstName: name.givenName,
        lastName: name.familyName,
      };

      done(null, user);
    } catch (err) {
      throw new UnauthorizedException();
    }
  }
}
