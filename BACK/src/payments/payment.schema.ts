import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { baseSchemaOptions } from '../common/schema-options';

export enum PaymentMethod {
  CARD = 'card',
  TRANSFER = 'transfer',
  CASH = 'cash',
}

export enum PaymentStatus {
  PAID = 'paid',
  FAILED = 'failed',
}

export type PaymentDocument = HydratedDocument<Payment>;

/** Enrolment of a child with a teacher for a given formation (subject). */
@Schema(baseSchemaOptions)
export class Payment {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User', index: true })
  parent: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User', index: true })
  teacher: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Child' })
  child: Types.ObjectId;

  @Prop({ required: true, trim: true })
  formation: string;

  /** Amount in Tunisian dinars. */
  @Prop({ required: true, min: 1 })
  amount: number;

  @Prop({ enum: PaymentMethod, default: PaymentMethod.CARD })
  method: PaymentMethod;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PAID })
  status: PaymentStatus;

  @Prop({ required: true, unique: true })
  reference: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
