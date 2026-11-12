import { ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Gender, Role } from '../common/enums';

export const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
export const PASSWORD_MESSAGE =
  'Password must be at least 8 characters and contain letters and numbers';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @IsEmail()
  email: string;

  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  qualifications?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  expertise?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  accountStatus?: boolean;
}

/** What users may change on their own account (no role, no status). */
export class UpdateProfileDto extends PartialType(
  PickType(CreateUserDto, [
    'name',
    'email',
    'phone',
    'gender',
    'qualifications',
    'expertise',
    'bio',
  ] as const),
) {}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  newPassword: string;
}

export class AssignMentorDto {
  @IsMongoId()
  mentorId: string;
}

export class ActivateDto {
  @ApiPropertyOptional({ description: 'Mentor to assign while activating' })
  @IsOptional()
  @IsMongoId()
  mentorId?: string;
}

export class ListUsersQuery {
  @ApiPropertyOptional({ description: 'Role name or number, e.g. "teacher"' })
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '"pending" lists parents awaiting activation' })
  @IsOptional()
  @IsString()
  status?: string;
}
