import { SchemaOptions } from '@nestjs/mongoose';

/** Common options: timestamps, `id` virtual and no internal fields in JSON. */
export const baseSchemaOptions: SchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      return ret;
    },
  },
};
