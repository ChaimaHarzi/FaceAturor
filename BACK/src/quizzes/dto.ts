import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class QuestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  text: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  choices: string[];

  @IsInt()
  @Min(0)
  correctIndex: number;
}

export class CreateQuizDto {
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

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  children: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}

export class UpdateQuizDto extends PartialType(CreateQuizDto) {}

export class SubmitQuizDto {
  @IsMongoId()
  childId: string;

  @IsArray()
  @IsInt({ each: true })
  answers: number[];
}

export class QuizQuery {
  @ApiPropertyOptional({ description: 'Student view: quizzes assigned to this child' })
  @IsOptional()
  @IsMongoId()
  childId?: string;
}
