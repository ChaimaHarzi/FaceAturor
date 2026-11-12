import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { isAdmin, Role } from '../common/enums';
import { AccessService } from '../database/access.service';
import { Child } from '../children/child.schema';
import { Course } from '../courses/course.schema';
import { SessionEvent } from '../events/event.schema';
import { Meeting } from '../meetings/meeting.schema';
import { Payment } from '../payments/payment.schema';
import { Quiz, QuizAttempt } from '../quizzes/quiz.schema';
import { Feedback, Rating } from '../reviews/review.schemas';
import { User } from '../users/user.schema';

const oid = (id: string) => new Types.ObjectId(id);

/** First day (UTC) of the month `offset` months from now. */
const monthStart = (offset: number) => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
};

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Child.name) private readonly children: Model<Child>,
    @InjectModel(Course.name) private readonly courses: Model<Course>,
    @InjectModel(Quiz.name) private readonly quizzes: Model<Quiz>,
    @InjectModel(QuizAttempt.name) private readonly attempts: Model<QuizAttempt>,
    @InjectModel(Meeting.name) private readonly meetings: Model<Meeting>,
    @InjectModel(SessionEvent.name) private readonly events: Model<SessionEvent>,
    @InjectModel(Payment.name) private readonly payments: Model<Payment>,
    @InjectModel(Feedback.name) private readonly feedback: Model<Feedback>,
    @InjectModel(Rating.name) private readonly ratings: Model<Rating>,
    private readonly access: AccessService,
  ) {}

  async forUser(user: AuthUser, childId?: string) {
    if (childId) return this.student(user, childId);
    if (isAdmin(user.role)) return this.admin();
    if (user.role === Role.TEACHER) return this.teacher(user.id);
    if (user.role === Role.MENTOR) return this.mentor(user.id);
    if (user.role === Role.PARENT) return this.parent(user.id);
    throw new ForbiddenException();
  }

  private async monthly(model: Model<any>, match: object, sumField?: string) {
    const rows = await model.aggregate<{ _id: string; value: number }>([
      { $match: { ...match, createdAt: { $gte: monthStart(-5) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          value: sumField ? { $sum: `$${sumField}` } : { $sum: 1 },
        },
      },
    ]);
    const byMonth = new Map(rows.map((r) => [r._id, r.value]));
    return Array.from({ length: 6 }, (_, i) => {
      const key = monthStart(i - 5)
        .toISOString()
        .slice(0, 7);
      return { month: key, value: byMonth.get(key) ?? 0 };
    });
  }

  private async admin() {
    const countRole = (role: Role, extra = {}) => this.users.countDocuments({ role, ...extra });
    const [
      parents,
      pending,
      teachers,
      mentors,
      admins,
      children,
      courses,
      quizzes,
      upcomingMeetings,
      paymentsAgg,
      feedbackAgg,
      paymentsByMonth,
      signupsByMonth,
    ] = await Promise.all([
      countRole(Role.PARENT, { accountStatus: true }),
      countRole(Role.PARENT, { accountStatus: false }),
      countRole(Role.TEACHER),
      countRole(Role.MENTOR),
      this.users.countDocuments({ role: { $in: [Role.ADMIN, Role.SUPER_ADMIN] } }),
      this.children.countDocuments(),
      this.courses.countDocuments(),
      this.quizzes.countDocuments(),
      this.meetings.countDocuments({ date: { $gte: new Date() } }),
      this.payments.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      this.feedback.aggregate([
        { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      this.monthly(this.payments, {}, 'amount'),
      this.monthly(this.users, { role: Role.PARENT }),
    ]);
    return {
      role: 'admin',
      users: { parents, pending, teachers, mentors, admins },
      children,
      courses,
      quizzes,
      upcomingMeetings,
      payments: { total: paymentsAgg[0]?.total ?? 0, count: paymentsAgg[0]?.count ?? 0 },
      feedback: {
        average: feedbackAgg[0] ? Math.round(feedbackAgg[0].average * 10) / 10 : null,
        count: feedbackAgg[0]?.count ?? 0,
      },
      paymentsByMonth,
      signupsByMonth,
    };
  }

  private async teacher(id: string) {
    const childIds = await this.access.childIdsOfTeacher(id);
    const quizIds = (await this.quizzes.find({ teacher: id }, '_id').lean()).map((q) => q._id);
    const [parents, courses, quizzes, scoreAgg, ratingAgg, earnings, upcoming] = await Promise.all([
      this.access.parentIdsOfTeacher(id),
      this.courses.countDocuments({ teacher: id }),
      quizIds.length,
      this.attempts.aggregate([
        { $match: { quiz: { $in: quizIds } } },
        {
          $group: {
            _id: null,
            average: { $avg: { $divide: ['$score', '$total'] } },
            count: { $sum: 1 },
          },
        },
      ]),
      this.ratings.aggregate([
        { $match: { teacher: oid(id) } },
        { $group: { _id: null, average: { $avg: '$score' }, count: { $sum: 1 } } },
      ]),
      this.payments.aggregate([
        { $match: { teacher: oid(id) } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.events
        .find({ teacher: id, start: { $gte: new Date() } })
        .populate('child', 'firstName lastName')
        .sort({ start: 1 })
        .limit(5),
    ]);
    return {
      role: 'teacher',
      students: childIds.length,
      parents: parents.length,
      courses,
      quizzes,
      attempts: scoreAgg[0]?.count ?? 0,
      averageScorePercent: scoreAgg[0] ? Math.round(scoreAgg[0].average * 100) : null,
      rating: {
        average: ratingAgg[0] ? Math.round(ratingAgg[0].average * 10) / 10 : null,
        count: ratingAgg[0]?.count ?? 0,
      },
      earnings: earnings[0]?.total ?? 0,
      upcomingSessions: upcoming,
    };
  }

  private async mentor(id: string) {
    const parentIds = await this.access.parentIdsOfMentor(id);
    const [children, withoutTeacher, upcoming, totalMeetings, teachers] = await Promise.all([
      this.children.countDocuments({ parent: { $in: parentIds } }),
      this.children.countDocuments({ parent: { $in: parentIds }, teachers: { $size: 0 } }),
      this.meetings
        .find({ mentor: id, date: { $gte: new Date() } })
        .populate('parent', 'name email')
        .sort({ date: 1 })
        .limit(5),
      this.meetings.countDocuments({ mentor: id }),
      this.users.countDocuments({ role: Role.TEACHER }),
    ]);
    return {
      role: 'mentor',
      parents: parentIds.length,
      children,
      childrenWithoutTeacher: withoutTeacher,
      teachers,
      totalMeetings,
      upcomingMeetings: upcoming,
    };
  }

  private async parent(id: string) {
    const childIds = await this.access.childIdsOfParent(id);
    const [paid, upcoming] = await Promise.all([
      this.payments.aggregate([
        { $match: { parent: oid(id) } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.events
        .find({ child: { $in: childIds }, start: { $gte: new Date() } })
        .populate('child', 'firstName lastName')
        .populate('teacher', 'name')
        .sort({ start: 1 })
        .limit(5),
    ]);
    return {
      role: 'parent',
      children: childIds.length,
      totalPaid: paid[0]?.total ?? 0,
      upcomingSessions: upcoming,
    };
  }

  /** "Progress dashboard" of the student space. */
  private async student(user: AuthUser, childId: string) {
    await this.access.getChild(user, childId);
    const assigned = await this.quizzes
      .find({ children: childId }, '_id title subject deadline')
      .lean();
    const [courses, attempts, upcoming] = await Promise.all([
      this.courses.countDocuments({ children: childId }),
      this.attempts
        .find({ child: childId })
        .populate('quiz', 'title subject')
        .sort({ createdAt: -1 }),
      this.events
        .find({ child: childId, start: { $gte: new Date() } })
        .populate('teacher', 'name')
        .sort({ start: 1 })
        .limit(5),
    ]);
    const done = new Set(attempts.map((a) => String((a.quiz as any)?._id ?? a.quiz)));
    const percent = attempts.length
      ? Math.round((attempts.reduce((s, a) => s + a.score / a.total, 0) / attempts.length) * 100)
      : null;
    return {
      role: 'student',
      courses,
      quizzesAssigned: assigned.length,
      quizzesDone: attempts.length,
      quizzesPending: assigned.filter((q) => !done.has(String(q._id))).length,
      averageScorePercent: percent,
      results: attempts.slice(0, 10).map((a) => ({
        quiz: a.quiz,
        score: a.score,
        total: a.total,
        submittedAt: (a as any).createdAt,
      })),
      upcomingSessions: upcoming,
    };
  }

  // ---------- public (home page) ----------

  async publicTeachers() {
    const teachers = await this.users
      .find({ role: Role.TEACHER }, 'name gender expertise qualifications bio')
      .limit(12)
      .lean();
    const stats = await this.ratings.aggregate<{
      _id: Types.ObjectId;
      average: number;
      count: number;
    }>([
      { $match: { teacher: { $in: teachers.map((t) => t._id) } } },
      { $group: { _id: '$teacher', average: { $avg: '$score' }, count: { $sum: 1 } } },
    ]);
    const byTeacher = new Map(stats.map((s) => [String(s._id), s]));
    return teachers.map((t) => {
      const s = byTeacher.get(String(t._id));
      return {
        id: String(t._id),
        name: t.name,
        gender: t.gender,
        expertise: t.expertise ?? [],
        qualifications: t.qualifications ?? [],
        bio: t.bio,
        rating: { average: s ? Math.round(s.average * 10) / 10 : null, count: s?.count ?? 0 },
      };
    });
  }

  async publicStats() {
    const [teachers, mentors, students, courses, feedback] = await Promise.all([
      this.users.countDocuments({ role: Role.TEACHER }),
      this.users.countDocuments({ role: Role.MENTOR }),
      this.children.countDocuments(),
      this.courses.countDocuments(),
      this.feedback
        .find({ rating: { $gte: 4 }, comment: { $nin: [null, ''] } })
        .populate('parent', 'name')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
    ]);
    return {
      teachers,
      mentors,
      students,
      courses,
      testimonials: feedback.map((f) => ({
        name: (f.parent as any)?.name ?? 'A parent',
        rating: f.rating,
        comment: f.comment,
      })),
    };
  }
}
