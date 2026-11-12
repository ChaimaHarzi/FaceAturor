import { PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsMongoId()
  parent: string;

  @IsMongoId()
  mentor: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(240)
  durationMinutes?: number;

  /** Zoom (or Meet/Teams) link sent to the participants. */
  @IsUrl({ require_protocol: true })
  link: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateMeetingDto extends PartialType(CreateMeetingDto) {}

export class AvailabilityQuery {
  @IsMongoId()
  mentorId: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(240)
  durationMinutes?: number;

  /** Ignore this meeting (when editing it). */
  @IsOptional()
  @IsMongoId()
  excludeId?: string;
}
