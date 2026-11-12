import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { baseSchemaOptions } from '../common/schema-options';

export type MessageDocument = HydratedDocument<Message>;

@Schema(baseSchemaOptions)
export class Message {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  sender: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  receiver: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  content: string;

  @Prop()
  readAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, readAt: 1 });
