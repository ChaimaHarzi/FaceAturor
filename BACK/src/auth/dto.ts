import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Gender } from '../common/enums';
import { PASSWORD_MESSAGE, PASSWORD_RULE } from '../users/dto';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

/** Guest sign-up: always creates a parent account pending activation. */
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @IsEmail()
  email: string;

  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  /** Preferred range for the first meeting with a mentor. */
  @IsDateString()
  availableFrom: string;

  @IsDateString()
  availableTo: string;
}

export class EmailDto {
  @IsEmail()
  email: string;
}

export class TokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResetPasswordDto extends TokenDto {
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  password: string;
}
