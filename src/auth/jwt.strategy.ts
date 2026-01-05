import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      // eslint-disable-next-line no-console
      console.log('JWT_SECRET loaded? false');
      throw new Error(
        'JWT_SECRET is not set. Check .env and ConfigModule.forRoot().',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });

    // eslint-disable-next-line no-console
    console.log('JWT_SECRET loaded? true len=', secret.length);
  }

  validate(payload: { sub: number; email: string; role?: string }) {
    // request.user içine dönecek obje
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
