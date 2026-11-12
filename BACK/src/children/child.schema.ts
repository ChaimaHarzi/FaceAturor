import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { baseSchemaOptions } from '../common/schema-options';
import { Gender } from '../common/enums';

export type ChildDocument = HydratedDocument<Child>;

/** "Student" in the report: a child profile managed by its parent. */
@Schema(baseSchemaOptions)
export class Child {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User', index: true })
  parent: Types.ObjectId;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ enum: Gender, type: Number })
  gender?: Gender;

  @Prop()
  dateOfBirth?: Date;

  /** School grade, e.g. "5th grade". */
  @Prop({ required: true, trim: true })
  grade: string;

  @Prop({ trim: true })
  specialNeeds?: string;

  /** Teachers assigned by the mentor or an admin. */
  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'User' }], default: [], index: true })
  teachers: Types.ObjectId[];
}

export const ChildSchema = SchemaFactory.createForClass(Child);
