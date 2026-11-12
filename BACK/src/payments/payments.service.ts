import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { randomBytes } from 'crypto';
import { FilterQuery, Model } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { isAdmin, Role } from '../common/enums';
import { AccessService } from '../database/access.service';
import { MailService } from '../mail/mail.service';
import { User } from '../users/user.schema';
import { Payment, PaymentMethod, PaymentStatus } from './payment.schema';

export class CreatePaymentDto {
  @IsMongoId()
  child: string;

  @IsMongoId()
  teacher: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  formation: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(1)
  @Max(100000)
  amount: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;
}

const POPULATE = [
  { path: 'parent', select: 'name email' },
  { path: 'teacher', select: 'name email' },
  { path: 'child', select: 'firstName lastName' },
];

/**
 * Payment processing is simulated: every valid request is accepted and gets a
 * reference. Swap `charge()` for a real gateway (Stripe, Konnect...) later.
 */
@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private readonly payments: Model<Payment>,
    private readonly access: AccessService,
    private readonly mail: MailService,
  ) {}

  list(user: AuthUser) {
    const filter: FilterQuery<Payment> = {};
    if (user.role === Role.PARENT) filter.parent = user.id;
    else if (user.role === Role.TEACHER) filter.teacher = user.id;
    else if (!isAdmin(user.role)) throw new ForbiddenException();
    return this.payments.find(filter).populate(POPULATE).sort({ createdAt: -1 });
  }

  private charge() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return {
      status: PaymentStatus.PAID,
      reference: `PAY-${date}-${randomBytes(3).toString('hex').toUpperCase()}`,
    };
  }

  async create(user: AuthUser, dto: CreatePaymentDto) {
    const child = await this.access.getChild(user, dto.child);
    if (!child.teachers.some((t) => String(t) === dto.teacher)) {
      throw new BadRequestException('This teacher is not assigned to this child');
    }
    const result = this.charge();
    const payment = await this.payments.create({ ...dto, parent: user.id, ...result });
    await payment.populate(POPULATE);

    const teacher = payment.teacher as unknown as User;
    await this.mail.send(
      user.email,
      `Payment receipt ${payment.reference}`,
      this.mail.layout(
        'Payment received',
        `<p>Formation: <b>${payment.formation}</b><br/>Student: ${child.firstName} ${child.lastName}<br/>Teacher: ${teacher.name}<br/>Amount: <b>${payment.amount} TND</b><br/>Reference: ${payment.reference}</p>`,
      ),
    );
    return payment;
  }
}
