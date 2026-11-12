import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { EmptyToUndefined, ToStringArray } from '../common/transforms';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  subject: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @EmptyToUndefined()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  link?: string;

  @ToStringArray()
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsMongoId({ each: true })
  children?: string[];
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

export class ListByChildQuery {
  @ApiPropertyOptional({ description: 'Parent/student view: content of one child' })
  @IsOptional()
  @IsMongoId()
  childId?: string;
}
