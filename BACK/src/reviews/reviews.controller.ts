import { Body, Controller, ForbiddenException, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { ADMIN_ROLES, isAdmin, Role } from '../common/enums';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { CreateFeedbackDto, RateTeacherDto, ReviewsService } from './reviews.service';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post('feedback')
  @Roles(Role.PARENT)
  createFeedback(@CurrentUser() user: AuthUser, @Body() dto: CreateFeedbackDto) {
    return this.reviews.createFeedback(user, dto);
  }

  @Get('feedback')
  @Roles(...ADMIN_ROLES)
  listFeedback() {
    return this.reviews.listFeedback();
  }

  @Get('feedback/mine')
  @Roles(Role.PARENT)
  myFeedback(@CurrentUser() user: AuthUser) {
    return this.reviews.myFeedback(user);
  }

  @Post('ratings')
  @Roles(Role.PARENT)
  rate(@CurrentUser() user: AuthUser, @Body() dto: RateTeacherDto) {
    return this.reviews.rateTeacher(user, dto);
  }

  @Get('ratings/mine')
  @Roles(Role.PARENT)
  myRatings(@CurrentUser() user: AuthUser) {
    return this.reviews.myRatings(user);
  }

  /** Detailed evaluations: the teacher themself, mentors and admins. */
  @Get('ratings/teacher/:id')
  teacherRatings(@CurrentUser() user: AuthUser, @Param('id', ParseObjectIdPipe) id: string) {
    const allowed = isAdmin(user.role) || user.role === Role.MENTOR || user.id === id;
    if (!allowed) throw new ForbiddenException();
    return this.reviews.teacherRatings(id);
  }
}
