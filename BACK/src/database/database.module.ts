import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/user.schema';
import { Child, ChildSchema } from '../children/child.schema';
import { Meeting, MeetingSchema } from '../meetings/meeting.schema';
import { Message, MessageSchema } from '../messages/message.schema';
import { Course, CourseSchema } from '../courses/course.schema';
import { SessionEvent, SessionEventSchema } from '../events/event.schema';
import { Quiz, QuizAttempt, QuizAttemptSchema, QuizSchema } from '../quizzes/quiz.schema';
import { Payment, PaymentSchema } from '../payments/payment.schema';
import { Feedback, FeedbackSchema, Rating, RatingSchema } from '../reviews/review.schemas';
import { AccessService } from './access.service';

const models = MongooseModule.forFeature([
  { name: User.name, schema: UserSchema },
  { name: Child.name, schema: ChildSchema },
  { name: Meeting.name, schema: MeetingSchema },
  { name: Message.name, schema: MessageSchema },
  { name: Course.name, schema: CourseSchema },
  { name: SessionEvent.name, schema: SessionEventSchema },
  { name: Quiz.name, schema: QuizSchema },
  { name: QuizAttempt.name, schema: QuizAttemptSchema },
  { name: Payment.name, schema: PaymentSchema },
  { name: Feedback.name, schema: FeedbackSchema },
  { name: Rating.name, schema: RatingSchema },
]);

/** All models are shared so services can query relations without circular imports. */
@Global()
@Module({
  imports: [models],
  providers: [AccessService],
  exports: [models, AccessService],
})
export class DatabaseModule {}
