import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ChildrenModule } from './children/children.module';
import { JwtAuthGuard, RolesGuard } from './common/guards';
import { CoursesModule } from './courses/courses.module';
import { DatabaseModule } from './database/database.module';
import { EventsModule } from './events/events.module';
import { MailModule } from './mail/mail.module';
import { MeetingsModule } from './meetings/meetings.module';
import { MessagesModule } from './messages/messages.module';
import { PaymentsModule } from './payments/payments.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { ReviewsModule } from './reviews/reviews.module';
import { StatsModule } from './stats/stats.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGO_CONNECTION_STRING'),
      }),
    }),
    DatabaseModule,
    MailModule,
    AuthModule,
    UsersModule,
    ChildrenModule,
    MeetingsModule,
    MessagesModule,
    CoursesModule,
    EventsModule,
    QuizzesModule,
    PaymentsModule,
    ReviewsModule,
    StatsModule,
  ],
  providers: [
    // Secure by default: every route needs a JWT unless marked @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
