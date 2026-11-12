import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Public } from '../common/decorators';
import { QuizQuery } from '../quizzes/dto';
import { StatsService } from './stats.service';

@ApiTags('stats')
@Controller()
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  /** Dashboard of the current user (or of a student with ?childId=). */
  @ApiBearerAuth()
  @Get('stats')
  forUser(@CurrentUser() user: AuthUser, @Query() { childId }: QuizQuery) {
    return this.stats.forUser(user, childId);
  }

  @Public()
  @Get('public/teachers')
  publicTeachers() {
    return this.stats.publicTeachers();
  }

  @Public()
  @Get('public/stats')
  publicStats() {
    return this.stats.publicStats();
  }
}
