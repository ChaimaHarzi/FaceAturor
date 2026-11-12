import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { baseSchemaOptions } from '../common/schema-options';

export type CourseDocument = HydratedDocument<Course>;

/** "EducationalContent" in the report: a document or link shared with students. */
@Schema(baseSchemaOptions)
export class Course {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User', index: true })
  teacher: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  subject: string;

  @Prop({ trim: true })
  description?: string;

  /** External resource (video, website...). */
  @Prop({ trim: true })
  link?: string;

  /** Uploaded file hosted on Cloudinary. */
  @Prop()
  fileUrl?: string;

  @Prop()
  fileName?: string;

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'Child' }], default: [], index: true })
  children: Types.ObjectId[];
}

export const CourseSchema = SchemaFactory.createForClass(Course);
