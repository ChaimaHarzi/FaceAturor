import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { ADMIN_ROLES, Role } from '../common/enums';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { CreateQuizDto, QuizQuery, SubmitQuizDto, UpdateQuizDto } from './dto';
import { QuizzesService } from './quizzes.service';

@ApiTags('quizzes')
@ApiBearerAuth()
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzes: QuizzesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() { childId }: QuizQuery) {
    return childId ? this.quizzes.listForChild(user, childId) : this.quizzes.listForTeacher(user);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Query() { childId }: QuizQuery,
  ) {
    return this.quizzes.findOne(user, id, childId);
  }

  @Get(':id/results')
  @Roles(Role.TEACHER, ...ADMIN_ROLES)
  results(@CurrentUser() user: AuthUser, @Param('id', ParseObjectIdPipe) id: string) {
    return this.quizzes.results(user, id);
  }

  @Post()
  @Roles(Role.TEACHER)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateQuizDto) {
    return this.quizzes.create(user, dto);
  }

  @Post(':id/submit')
  @Roles(Role.PARENT)
  submit(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.quizzes.submit(user, id, dto);
  }

  @Patch(':id')
  @Roles(Role.TEACHER)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizzes.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.TEACHER, ...ADMIN_ROLES)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseObjectIdPipe) id: string) {
    return this.quizzes.remove(user, id);
  }
}
