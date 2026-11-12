import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { baseSchemaOptions } from '../common/schema-options';
import { Gender, Role } from '../common/enums';

export type UserDocument = HydratedDocument<User>;

@Schema(baseSchemaOptions)
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ trim: true, default: '' })
  phone: string;

  @Prop({ required: true, enum: Role, type: Number, index: true })
  role: Role;

  @Prop({ enum: Gender, type: Number, default: Gender.MALE })
  gender: Gender;

  /** False for parents until an admin activates them after the first meeting. */
  @Prop({ default: true })
  accountStatus: boolean;

  /** Only explicitly false for self-registered parents who did not verify yet. */
  @Prop()
  emailVerified?: boolean;

  /** Parent: preferred range for the first meeting with a mentor. */
  @Prop()
  availableFrom?: Date;

  @Prop()
  availableTo?: Date;

  /** Parent: mentor assigned by the admin. */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  mentor?: Types.ObjectId;

  /** Teacher profile. */
  @Prop({ type: [String], default: undefined })
  qualifications?: string[];

  @Prop({ type: [String], default: undefined })
  expertise?: string[];

  @Prop({ trim: true })
  bio?: string;

  @Prop({ select: false })
  emailVerificationToken?: string;

  @Prop({ select: false })
  passwordResetToken?: string;

  @Prop({ select: false })
  passwordResetExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
