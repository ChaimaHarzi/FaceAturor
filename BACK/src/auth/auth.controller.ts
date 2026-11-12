import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth-user';
import { AllowInactive, CurrentUser, Public } from '../common/decorators';
import { ChangePasswordDto } from '../users/dto';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { EmailDto, LoginDto, RegisterDto, ResetPasswordDto, TokenDto } from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(200)
  verifyEmail(@Body() dto: TokenDto) {
    return this.auth.verifyEmail(dto.token);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(200)
  resendVerification(@Body() dto: EmailDto) {
    return this.auth.resendVerification(dto.email);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: EmailDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @ApiBearerAuth()
  @AllowInactive()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.users.findById(user.id);
  }

  @ApiBearerAuth()
  @AllowInactive()
  @Patch('password')
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user, dto);
  }
}
