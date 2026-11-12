import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { baseSchemaOptions } from '../common/schema-options';

@Schema({ _id: false })
export class Question {
  @Prop({ required: true, trim: true })
  text: string;

  @Prop({ type: [String], required: true })
  choices: string[];

  @Prop({ required: true, min: 0 })
  correctIndex: number;
}
export const QuestionSchema = SchemaFactory.createForClass(Question);

export type QuizDocument = HydratedDocument<Quiz>;

@Schema(baseSchemaOptions)
export class Quiz {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User', index: true })
  teacher: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  subject: string;

  @Prop({ trim: true })
  description?: string;

  @Prop()
  deadline?: Date;

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'Child' }], default: [], index: true })
  children: Types.ObjectId[];

  @Prop({ type: [QuestionSchema], required: true })
  questions: Question[];
}
export const QuizSchema = SchemaFactory.createForClass(Quiz);

export type QuizAttemptDocument = HydratedDocument<QuizAttempt>;

/** "Score" in the report: one attempt per student and quiz. */
@Schema(baseSchemaOptions)
export class QuizAttempt {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Quiz', index: true })
  quiz: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Child', index: true })
  child: Types.ObjectId;

  @Prop({ type: [Number], required: true })
  answers: number[];

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  total: number;
}
export const QuizAttemptSchema = SchemaFactory.createForClass(QuizAttempt);
QuizAttemptSchema.index({ quiz: 1, child: 1 }, { unique: true });
