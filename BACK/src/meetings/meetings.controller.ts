import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { ADMIN_ROLES } from '../common/enums';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { AvailabilityQuery, CreateMeetingDto, UpdateMeetingDto } from './dto';
import { MeetingsService } from './meetings.service';

@ApiTags('meetings')
@ApiBearerAuth()
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetings: MeetingsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.meetings.list(user);
  }

  @Get('availability')
  @Roles(...ADMIN_ROLES)
  availability(@Query() query: AvailabilityQuery) {
    return this.meetings.checkAvailability(query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseObjectIdPipe) id: string) {
    return this.meetings.findOne(user, id);
  }

  @Post()
  @Roles(...ADMIN_ROLES)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMeetingDto) {
    return this.meetings.create(user, dto);
  }

  @Patch(':id')
  @Roles(...ADMIN_ROLES)
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateMeetingDto) {
    return this.meetings.update(id, dto);
  }

  @Delete(':id')
  @Roles(...ADMIN_ROLES)
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.meetings.remove(id);
  }
}
