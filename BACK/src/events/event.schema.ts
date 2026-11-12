import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { baseSchemaOptions } from '../common/schema-options';

export type SessionEventDocument = HydratedDocument<SessionEvent>;

/** A tutoring session on the teacher's calendar, shown on the student's calendar. */
@Schema({ ...baseSchemaOptions, collection: 'sessionevents' })
export class SessionEvent {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User', index: true })
  teacher: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Child', index: true })
  child: Types.ObjectId;

  @Prop({ required: true, trim: true })
  subject: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, index: true })
  start: Date;

  @Prop({ required: true })
  end: Date;

  /** Zoom (or other) link for the session. */
  @Prop({ trim: true })
  link?: string;
}

export const SessionEventSchema = SchemaFactory.createForClass(SessionEvent);
