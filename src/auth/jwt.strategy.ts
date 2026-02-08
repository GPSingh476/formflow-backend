import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

const JWT_SECRET: string = (() => {
  const v = process.env.JWT_ACCESS_SECRET;
  if (!v) throw new Error('JWT_ACCESS_SECRET is missing in .env');
  return v;
})();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET, // now typed as string (not string | undefined)
    });
  }

  async validate(payload: any) {
    // This becomes req.user in controllers
    return { sub: payload.sub, email: payload.email };
  }
}
