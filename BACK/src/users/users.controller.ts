import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth-user';
import { AllowInactive, CurrentUser, Roles } from '../common/decorators';
import { ADMIN_ROLES, Role } from '../common/enums';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import {
  ActivateDto,
  AssignMentorDto,
  CreateUserDto,
  ListUsersQuery,
  UpdateProfileDto,
  UpdateUserDto,
} from './dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // ----- own account (declared first so "me" is not read as an id) -----

  @Get('me')
  @AllowInactive()
  me(@CurrentUser() user: AuthUser) {
    return this.users.findById(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateMe(user, dto);
  }

  @Delete('me')
  @AllowInactive()
  deleteMe(@CurrentUser() user: AuthUser) {
    return this.users.deleteMe(user);
  }

  @Get('me/mentor')
  @Roles(Role.PARENT)
  myMentor(@CurrentUser() user: AuthUser) {
    return this.users.myMentor(user);
  }

  // ----- directory -----

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListUsersQuery) {
    return this.users.list(user, query);
  }

  // ----- administration -----

  @Post()
  @Roles(...ADMIN_ROLES)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto) {
    return this.users.create(dto, user);
  }

  @Get(':id')
  @Roles(...ADMIN_ROLES)
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.users.findById(id);
  }

  @Patch(':id')
  @Roles(...ADMIN_ROLES)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.update(id, dto, user);
  }

  @Patch(':id/activate')
  @Roles(...ADMIN_ROLES)
  activate(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: ActivateDto) {
    return this.users.activate(id, dto.mentorId);
  }

  @Patch(':id/mentor')
  @Roles(...ADMIN_ROLES)
  assignMentor(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: AssignMentorDto) {
    return this.users.assignMentor(id, dto.mentorId);
  }

  @Delete(':id')
  @Roles(...ADMIN_ROLES)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseObjectIdPipe) id: string) {
    return this.users.remove(id, user);
  }
}
