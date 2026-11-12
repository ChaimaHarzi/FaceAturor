import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Gender } from '../common/enums';

export class CreateChildDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  grade: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialNeeds?: string;
}

export class UpdateChildDto extends PartialType(CreateChildDto) {}

export class AssignTeachersDto {
  @IsArray()
  @ArrayMaxSize(20)
  @IsMongoId({ each: true })
  teacherIds: string[];
}

export class ListChildrenQuery {
  @ApiPropertyOptional({ description: 'Admins/mentors: children of one parent' })
  @IsOptional()
  @IsMongoId()
  parentId?: string;
}
