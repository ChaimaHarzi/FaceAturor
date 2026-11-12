import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { ADMIN_ROLES, Role } from '../common/enums';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { ChildrenService } from './children.service';
import { AssignTeachersDto, CreateChildDto, ListChildrenQuery, UpdateChildDto } from './dto';

@ApiTags('children')
@ApiBearerAuth()
@Controller('children')
export class ChildrenController {
  constructor(private readonly children: ChildrenService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListChildrenQuery) {
    return this.children.list(user, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseObjectIdPipe) id: string) {
    return this.children.findOne(user, id);
  }

  @Post()
  @Roles(Role.PARENT)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateChildDto) {
    return this.children.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.PARENT, ...ADMIN_ROLES)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateChildDto,
  ) {
    return this.children.update(user, id, dto);
  }

  @Patch(':id/teachers')
  @Roles(Role.MENTOR, ...ADMIN_ROLES)
  assignTeachers(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: AssignTeachersDto,
  ) {
    return this.children.assignTeachers(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.PARENT, ...ADMIN_ROLES)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseObjectIdPipe) id: string) {
    return this.children.remove(user, id);
  }
}
