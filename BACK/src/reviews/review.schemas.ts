import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { baseSchemaOptions } from '../common/schema-options';

export type FeedbackDocument = HydratedDocument<Feedback>;

/** Parent feedback about the platform. */
@Schema(baseSchemaOptions)
export class Feedback {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User', index: true })
  parent: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ trim: true, maxlength: 1000 })
  comment?: string;
}
export const FeedbackSchema = SchemaFactory.createForClass(Feedback);

export type RatingDocument = HydratedDocument<Rating>;

/** Parent evaluation of a teacher (one per parent/teacher pair, editable). */
@Schema(baseSchemaOptions)
export class Rating {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  parent: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User', index: true })
  teacher: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  score: number;

  @Prop({ trim: true, maxlength: 1000 })
  description?: string;
}
export const RatingSchema = SchemaFactory.createForClass(Rating);
RatingSchema.index({ parent: 1, teacher: 1 }, { unique: true });
