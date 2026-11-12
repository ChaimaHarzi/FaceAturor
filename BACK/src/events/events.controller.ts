import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { Role } from '../common/enums';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { CreateEventDto, ListEventsQuery, UpdateEventDto } from './dto';
import { EventsService } from './events.service';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListEventsQuery) {
    return this.events.list(user, query);
  }

  @Post()
  @Roles(Role.TEACHER)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateEventDto) {
    return this.events.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.TEACHER)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.events.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.TEACHER)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseObjectIdPipe) id: string) {
    return this.events.remove(user, id);
  }
}
