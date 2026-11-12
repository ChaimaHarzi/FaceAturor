import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { baseSchemaOptions } from '../common/schema-options';

export type MeetingDocument = HydratedDocument<Meeting>;

/** Parent–mentor meeting (Zoom) scheduled by an admin. */
@Schema(baseSchemaOptions)
export class Meeting {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User', index: true })
  parent: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User', index: true })
  mentor: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ required: true, index: true })
  date: Date;

  @Prop({ default: 60, min: 15, max: 240 })
  durationMinutes: number;

  @Prop({ required: true, trim: true })
  link: string;

  @Prop({ trim: true })
  notes?: string;
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);
