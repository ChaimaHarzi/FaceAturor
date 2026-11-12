import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { Role } from '../common/enums';
import { CreatePaymentDto, PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.payments.list(user);
  }

  @Post()
  @Roles(Role.PARENT)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentDto) {
    return this.payments.create(user, dto);
  }
}
