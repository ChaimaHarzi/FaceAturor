import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Model } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { ADMIN_ROLES, Role } from '../common/enums';
import { MailService } from '../mail/mail.service';
import { ChangePasswordDto } from '../users/dto';
import { User, UserDocument } from '../users/user.schema';
import { hashPassword, UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, ResetPasswordDto } from './dto';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const newToken = () => {
  const token = randomBytes(32).toString('hex');
  return { token, hash: hashToken(token) };
};

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    if (new Date(dto.availableTo) < new Date(dto.availableFrom)) {
      throw new BadRequestException('The end of the availability range must be after its start');
    }
    await this.users.assertEmailFree(dto.email);

    const { token, hash } = newToken();
    const user = await this.userModel.create({
      ...dto,
      role: Role.PARENT,
      accountStatus: false,
      emailVerified: false,
      emailVerificationToken: hash,
      password: await hashPassword(dto.password),
    });

    await this.sendVerificationEmail(user, token);
    await this.notifyAdminsOfPendingAccount(user);
    return {
      message: 'Account created. Please check your inbox to verify your email address.',
    };
  }

  private sendVerificationEmail(user: UserDocument, token: string) {
    return this.mail.send(
      user.email,
      'Verify your email address',
      this.mail.layout(
        `Hello ${user.name},`,
        '<p>Thanks for signing up to Faceatutor. Please confirm your email address. A mentor will then contact you for a first meeting during the period you selected.</p>',
        { label: 'Verify my email', url: this.mail.link(`/verify-email?token=${token}`) },
      ),
    );
  }

  private async notifyAdminsOfPendingAccount(parent: UserDocument) {
    const admins = await this.userModel.find({ role: { $in: ADMIN_ROLES } }, 'email').lean();
    await Promise.all(
      admins.map((a) =>
        this.mail.send(
          a.email,
          'New pending parent account',
          this.mail.layout(
            'New sign-up',
            `<p>${parent.name} (${parent.email}) is waiting for a first meeting with a mentor.</p>`,
            { label: 'Review pending accounts', url: this.mail.link('/admin/pending-accounts') },
          ),
        ),
      ),
    );
  }

  async verifyEmail(token: string) {
    const user = await this.userModel.findOne({ emailVerificationToken: hashToken(token) });
    if (!user)
      throw new BadRequestException('This verification link is invalid or was already used');
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
    return { message: 'Email verified. You can now sign in.' };
  }

  async resendVerification(email: string) {
    const user = await this.users.findByEmail(email, true);
    if (user && user.emailVerified === false) {
      const { token, hash } = newToken();
      user.emailVerificationToken = hash;
      await user.save();
      await this.sendVerificationEmail(user, token);
    }
    // Same answer whether the account exists or not (no user enumeration).
    return { message: 'If this account needs verification, a new email has been sent.' };
  }

  async login({ email, password }: LoginDto) {
    const user = await this.users.findByEmail(email, true);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Email or password is incorrect');
    }
    if (user.emailVerified === false) {
      throw new ForbiddenException('Please verify your email address before signing in');
    }
    return {
      accessToken: await this.jwt.signAsync({ sub: String(user._id), role: user.role }),
      user: user.toJSON(),
    };
  }

  async forgotPassword(email: string) {
    const user = await this.users.findByEmail(email);
    if (user) {
      const { token, hash } = newToken();
      user.passwordResetToken = hash;
      user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save();
      await this.mail.send(
        user.email,
        'Reset your password',
        this.mail.layout(
          'Password reset',
          '<p>Someone asked to reset the password of your Faceatutor account. This link is valid for one hour. If it was not you, you can ignore this email.</p>',
          { label: 'Choose a new password', url: this.mail.link(`/reset-password?token=${token}`) },
        ),
      );
    }
    return { message: 'If an account exists for this email, a reset link has been sent.' };
  }

  async resetPassword({ token, password }: ResetPasswordDto) {
    const user = await this.userModel
      .findOne({
        passwordResetToken: hashToken(token),
        passwordResetExpires: { $gt: new Date() },
      })
      .select('+passwordResetToken +passwordResetExpires');
    if (!user) throw new BadRequestException('This reset link is invalid or has expired');
    user.password = await hashPassword(password);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Following a link from the inbox also proves the email address.
    if (user.emailVerified === false) user.emailVerified = true;
    await user.save();
    return { message: 'Password updated. You can now sign in.' };
  }

  async changePassword(requester: AuthUser, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(requester.id).select('+password');
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new BadRequestException('Current password is incorrect');
    }
    user.password = await hashPassword(dto.newPassword);
    await user.save();
    return { message: 'Password updated' };
  }
}
