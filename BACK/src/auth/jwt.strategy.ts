import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../common/auth-user';
import { User } from '../users/user.schema';

export const jwtSecret = (config: ConfigService) => {
  const secret = config.get<string>('JWT_SECRET') ?? config.get<string>('TOKEN_SECRET');
  if (!secret) throw new Error('JWT_SECRET must be defined in .env');
  return secret;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectModel(User.name) private readonly users: Model<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret(config),
    });
  }

  /** Reloads the user so deleted/deactivated accounts lose access immediately. */
  async validate(payload: { sub: string }): Promise<AuthUser> {
    const user = await this.users.findById(payload.sub, 'name email role accountStatus').lean();
    if (!user) throw new UnauthorizedException();
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus !== false,
    };
  }
}
