import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { EmptyToUndefined } from '../common/transforms';

export class CreateEventDto {
  @IsMongoId()
  child: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  subject: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsDateString()
  start: string;

  @IsDateString()
  end: string;

  @EmptyToUndefined()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  link?: string;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}

export class ListEventsQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  childId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
