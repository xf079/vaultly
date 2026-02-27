import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, type StrategyOptions } from 'passport-jwt';
import type { JwtPayload } from '@/shared/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>(
        'JWT_SECRET',
        'vaultly-jwt-secret-change-in-production',
      ),
      issuer: config.get('JWT_ISSUER'),
      audience: config.get('JWT_AUDIENCE'),
    };
    super(options);
  }

  validate(payload: JwtPayload) {
    return {
      sub: payload.sub,
      email: payload.email,
      jti: payload.jti,
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}
