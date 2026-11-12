import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { isAdmin, Role } from '../common/enums';
import { AccessService } from '../database/access.service';
import { Quiz, QuizAttempt, QuizDocument } from './quiz.schema';
import { CreateQuizDto, SubmitQuizDto, UpdateQuizDto } from './dto';
import { scoreQuiz, validateQuestions } from './scoring';

const POPULATE = [
  { path: 'teacher', select: 'name' },
  { path: 'children', select: 'firstName lastName grade' },
];

@Injectable()
export class QuizzesService {
  constructor(
    @InjectModel(Quiz.name) private readonly quizzes: Model<Quiz>,
    @InjectModel(QuizAttempt.name) private readonly attempts: Model<QuizAttempt>,
    private readonly access: AccessService,
  ) {}

  /** Student-facing shape: answers hidden until the quiz is submitted. */
  private toStudentView(quiz: QuizDocument, attempt?: QuizAttempt | null) {
    const json = quiz.toJSON() as any;
    return {
      ...json,
      questions: json.questions.map((q: any, i: number) => ({
        text: q.text,
        choices: q.choices,
        ...(attempt ? { correctIndex: q.correctIndex, answer: attempt.answers[i] } : {}),
      })),
      attempt: attempt
        ? { score: attempt.score, total: attempt.total, submittedAt: (attempt as any).createdAt }
        : null,
    };
  }

  // ---------- teacher ----------

  async listForTeacher(user: AuthUser) {
    const filter = isAdmin(user.role) ? {} : { teacher: user.id };
    const quizzes = await this.quizzes.find(filter).populate(POPULATE).sort({ createdAt: -1 });
    const stats = await this.attempts.aggregate<{
      _id: Types.ObjectId;
      count: number;
      average: number;
    }>([
      { $match: { quiz: { $in: quizzes.map((q) => q._id) } } },
      {
        $group: {
          _id: '$quiz',
          count: { $sum: 1 },
          average: { $avg: { $divide: ['$score', '$total'] } },
        },
      },
    ]);
    const byQuiz = new Map(stats.map((s) => [String(s._id), s]));
    return quizzes.map((q) => {
      const s = byQuiz.get(String(q._id));
      return {
        ...q.toJSON(),
        attemptsCount: s?.count ?? 0,
        averagePercent: s ? Math.round(s.average * 100) : null,
      };
    });
  }

  private async assertOwnStudents(teacherId: string, childIds: string[]) {
    const mine = await this.access.childIdsOfTeacher(teacherId);
    if (childIds.some((id) => !mine.includes(id))) {
      throw new BadRequestException('You can only assign quizzes to your own students');
    }
  }

  private async getOwned(user: AuthUser, id: string) {
    const quiz = await this.quizzes.findById(id);
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (String(quiz.teacher) !== user.id && !isAdmin(user.role)) throw new ForbiddenException();
    return quiz;
  }

  async create(user: AuthUser, dto: CreateQuizDto) {
    validateQuestions(dto.questions);
    await this.assertOwnStudents(user.id, dto.children);
    const quiz = await this.quizzes.create({ ...dto, teacher: user.id });
    return quiz.populate(POPULATE);
  }

  async update(user: AuthUser, id: string, dto: UpdateQuizDto) {
    const quiz = await this.getOwned(user, id);
    if (dto.questions) {
      if (await this.attempts.exists({ quiz: quiz._id })) {
        throw new ConflictException('Questions cannot change once students have answered');
      }
      validateQuestions(dto.questions);
    }
    if (dto.children) await this.assertOwnStudents(String(quiz.teacher), dto.children);
    Object.assign(quiz, dto);
    await quiz.save();
    return quiz.populate(POPULATE);
  }

  async remove(user: AuthUser, id: string) {
    const quiz = await this.getOwned(user, id);
    await this.attempts.deleteMany({ quiz: quiz._id });
    await quiz.deleteOne();
    return { deleted: true };
  }

  async results(user: AuthUser, id: string) {
    const quiz = await this.getOwned(user, id);
    await quiz.populate(POPULATE);
    const attempts = await this.attempts
      .find({ quiz: quiz._id })
      .populate('child', 'firstName lastName grade')
      .sort({ createdAt: -1 });
    return { quiz, attempts };
  }

  // ---------- student (through the parent's session) ----------

  async listForChild(user: AuthUser, childId: string) {
    await this.access.getChild(user, childId);
    const quizzes = await this.quizzes
      .find({ children: childId })
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });
    const attempts = await this.attempts.find({
      child: childId,
      quiz: { $in: quizzes.map((q) => q._id) },
    });
    const byQuiz = new Map(attempts.map((a) => [String(a.quiz), a]));
    return quizzes.map((q) => {
      const view = this.toStudentView(q, byQuiz.get(String(q._id)));
      // The list does not need the questions themselves.
      return { ...view, questionsCount: q.questions.length, questions: undefined };
    });
  }

  async findOne(user: AuthUser, id: string, childId?: string) {
    const quiz = await this.quizzes.findById(id).populate(POPULATE);
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (user.role === Role.TEACHER || isAdmin(user.role)) {
      if (String((quiz.teacher as any)._id) !== user.id && !isAdmin(user.role))
        throw new ForbiddenException();
      return quiz;
    }
    if (!childId) throw new BadRequestException('childId is required');
    await this.assertAssigned(user, quiz, childId);
    const attempt = await this.attempts.findOne({ quiz: quiz._id, child: childId });
    return this.toStudentView(quiz, attempt);
  }

  private async assertAssigned(user: AuthUser, quiz: QuizDocument, childId: string) {
    await this.access.getChild(user, childId);
    const assigned = quiz.children.some((c: any) => String(c._id ?? c) === childId);
    if (!assigned) throw new ForbiddenException('This quiz is not assigned to this student');
  }

  async submit(user: AuthUser, id: string, { childId, answers }: SubmitQuizDto) {
    const quiz = await this.quizzes.findById(id);
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (user.role !== Role.PARENT)
      throw new ForbiddenException('Quizzes are taken from the student space');
    await this.assertAssigned(user, quiz, childId);
    if (quiz.deadline && quiz.deadline < new Date()) {
      throw new BadRequestException('The deadline for this quiz has passed');
    }
    if (await this.attempts.exists({ quiz: quiz._id, child: childId })) {
      throw new ConflictException('This quiz has already been submitted');
    }
    const { score, total } = scoreQuiz(quiz.questions, answers);
    const attempt = await this.attempts.create({
      quiz: quiz._id,
      child: childId,
      answers,
      score,
      total,
    });
    return this.toStudentView(await quiz.populate(POPULATE), attempt);
  }
}
