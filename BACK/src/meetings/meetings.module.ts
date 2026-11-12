import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';

@Module({
  imports: [UsersModule],
  controllers: [MeetingsController],
  providers: [MeetingsService],
})
export class MeetingsModule {}
