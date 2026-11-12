import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/decorators';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { MessagesService } from './messages.service';

export class SendMessageDto {
  @IsMongoId()
  receiver: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

@ApiTags('messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get('contacts')
  contacts(@CurrentUser() user: AuthUser) {
    return this.messages.contacts(user);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.messages.unreadCount(user);
  }

  @Get('with/:userId')
  thread(@CurrentUser() user: AuthUser, @Param('userId', ParseObjectIdPipe) userId: string) {
    return this.messages.thread(user, userId);
  }

  @Post()
  send(@CurrentUser() user: AuthUser, @Body() dto: SendMessageDto) {
    return this.messages.send(user, dto.receiver, dto.content.trim());
  }
}
