import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { FilterQuery, Model } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { isAdmin, parseRole, Role } from '../common/enums';
import { AccessService } from '../database/access.service';
import { MailService } from '../mail/mail.service';
import { Child } from '../children/child.schema';
import { Course } from '../courses/course.schema';
import { SessionEvent } from '../events/event.schema';
import { Message } from '../messages/message.schema';
import { Meeting } from '../meetings/meeting.schema';
import { Quiz, QuizAttempt } from '../quizzes/quiz.schema';
import { Rating } from '../reviews/review.schemas';
import { User, UserDocument } from './user.schema';
import { CreateUserDto, ListUsersQuery, UpdateProfileDto, UpdateUserDto } from './dto';

export const hashPassword = (password: string) => bcrypt.hash(password, 10);

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Child.name) private readonly children: Model<Child>,
    @InjectModel(Course.name) private readonly courses: Model<Course>,
    @InjectModel(SessionEvent.name) private readonly events: Model<SessionEvent>,
    @InjectModel(Message.name) private readonly messages: Model<Message>,
    @InjectModel(Meeting.name) private readonly meetings: Model<Meeting>,
    @InjectModel(Quiz.name) private readonly quizzes: Model<Quiz>,
    @InjectModel(QuizAttempt.name) private readonly attempts: Model<QuizAttempt>,
    @InjectModel(Rating.name) private readonly ratings: Model<Rating>,
    private readonly access: AccessService,
    private readonly mail: MailService,
  ) {}

  // ---------- lookups ----------

  findByEmail(email: string, withSecrets = false) {
    const query = this.users.findOne({ email: email.toLowerCase().trim() });
    return withSecrets
      ? query.select('+password +emailVerificationToken +passwordResetToken +passwordResetExpires')
      : query;
  }

  async findById(id: string) {
    const user = await this.users.findById(id).populate('mentor', 'name email phone gender');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Throws unless `id` is an active user with the expected role. */
  async ensureRole(id: string, role: Role, label = 'user') {
    const user = await this.users.findById(id);
    if (!user || user.role !== role) {
      throw new BadRequestException(`Selected ${label} does not exist`);
    }
    return user;
  }

  async assertEmailFree(email: string, exceptId?: string) {
    const existing = await this.users.findOne({ email: email.toLowerCase().trim() }, '_id').lean();
    if (existing && String(existing._id) !== exceptId) {
      throw new ConflictException('This email is already used');
    }
  }

  // ---------- admin management ----------

  private assertCanManageRole(requester: AuthUser, role: Role) {
    if (role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('Super admin accounts cannot be managed here');
    }
    if (role === Role.ADMIN && requester.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only the super admin can manage admins');
    }
  }

  async create(dto: CreateUserDto, requester: AuthUser) {
    this.assertCanManageRole(requester, dto.role);
    await this.assertEmailFree(dto.email);
    const user = await this.users.create({
      ...dto,
      password: await hashPassword(dto.password),
      accountStatus: true,
      emailVerified: true,
    });
    await this.mail.send(
      user.email,
      'Your Faceatutor account',
      this.mail.layout(
        `Welcome ${user.name}`,
        `<p>An account has been created for you on Faceatutor. You can sign in with this email address and the password given by the administrator. Please change it after your first login.</p>`,
        { label: 'Sign in', url: this.mail.link('/login') },
      ),
    );
    return user;
  }

  async list(requester: AuthUser, query: ListUsersQuery) {
    const filter: FilterQuery<User> = {};
    const role = query.role ? parseRole(query.role) : undefined;
    if (query.role && !role) throw new BadRequestException('Unknown role');
    if (role) filter.role = role;
    if (query.status === 'pending') {
      filter.role = Role.PARENT;
      filter.accountStatus = false;
    }
    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    if (!isAdmin(requester.role)) {
      // Non-admins only see the people they work with.
      const allowed = await this.visibleUserIds(requester, role);
      filter._id = { $in: allowed };
    }

    const users = await this.users
      .find(filter)
      .populate('mentor', 'name email')
      .sort({ createdAt: -1 });
    return this.withRatings(users);
  }

  private async visibleUserIds(requester: AuthUser, role?: Role): Promise<string[]> {
    const active = async (roles: Role[]) =>
      (await this.users.find({ role: { $in: roles }, accountStatus: true }, '_id').lean()).map(
        (u) => String(u._id),
      );

    const rules: Partial<Record<Role, Partial<Record<Role, () => Promise<string[]>>>>> = {
      [Role.MENTOR]: {
        [Role.TEACHER]: () => active([Role.TEACHER]),
        [Role.ADMIN]: () => active([Role.ADMIN, Role.SUPER_ADMIN]),
        [Role.PARENT]: () => this.access.parentIdsOfMentor(requester.id),
      },
      [Role.TEACHER]: {
        [Role.MENTOR]: () => active([Role.MENTOR]),
        [Role.ADMIN]: () => active([Role.ADMIN, Role.SUPER_ADMIN]),
        [Role.PARENT]: () => this.access.parentIdsOfTeacher(requester.id),
      },
      [Role.PARENT]: {
        [Role.TEACHER]: () => active([Role.TEACHER]),
      },
    };

    const allowed = rules[requester.role] ?? {};
    const targets = role ? [role] : (Object.keys(allowed).map(Number) as Role[]);
    const result = await Promise.all(targets.map((r) => allowed[r]?.() ?? []));
    return result.flat();
  }

  /** Adds `rating: { average, count }` to teachers. */
  async withRatings(users: UserDocument[]) {
    const teacherIds = users.filter((u) => u.role === Role.TEACHER).map((u) => u._id);
    if (!teacherIds.length) return users.map((u) => u.toJSON());
    const stats = await this.ratings.aggregate<{ _id: string; average: number; count: number }>([
      { $match: { teacher: { $in: teacherIds } } },
      { $group: { _id: '$teacher', average: { $avg: '$score' }, count: { $sum: 1 } } },
    ]);
    const byTeacher = new Map(stats.map((s) => [String(s._id), s]));
    return users.map((u) => {
      const json = u.toJSON();
      const s = byTeacher.get(String(u._id));
      if (u.role !== Role.TEACHER) return json;
      return {
        ...json,
        rating: { average: s ? Math.round(s.average * 10) / 10 : null, count: s?.count ?? 0 },
      };
    });
  }

  async update(id: string, dto: UpdateUserDto, requester: AuthUser) {
    const user = await this.findById(id);
    this.assertCanManageRole(requester, user.role);
    if (dto.role !== undefined) this.assertCanManageRole(requester, dto.role);
    if (dto.email) await this.assertEmailFree(dto.email, id);
    const { password, ...rest } = dto;
    Object.assign(user, rest);
    if (password) user.password = await hashPassword(password);
    return user.save();
  }

  async activate(id: string, mentorId?: string) {
    const parent = await this.ensureRole(id, Role.PARENT, 'parent');
    if (mentorId) {
      await this.ensureRole(mentorId, Role.MENTOR, 'mentor');
      parent.mentor = mentorId as any;
    }
    parent.accountStatus = true;
    await parent.save();
    await this.mail.send(
      parent.email,
      'Your Faceatutor account is active',
      this.mail.layout(
        'Welcome to Faceatutor!',
        `<p>Hello ${parent.name}, your account has been activated. You can now add your children, follow their progress and talk with their teachers and mentor.</p>`,
        { label: 'Open my space', url: this.mail.link('/login') },
      ),
    );
    return parent;
  }

  async assignMentor(parentId: string, mentorId: string) {
    const parent = await this.ensureRole(parentId, Role.PARENT, 'parent');
    await this.ensureRole(mentorId, Role.MENTOR, 'mentor');
    parent.mentor = mentorId as any;
    return parent.save();
  }

  async remove(id: string, requester: AuthUser) {
    if (id === requester.id) throw new BadRequestException('Use "delete my account" instead');
    const user = await this.findById(id);
    this.assertCanManageRole(requester, user.role);
    await this.deleteWithRelations(user);
    return { deleted: true };
  }

  /** Removes a user and everything that only makes sense with them. */
  private async deleteWithRelations(user: UserDocument) {
    const id = user._id;
    if (user.role === Role.PARENT) {
      const childIds = (await this.children.find({ parent: id }, '_id').lean()).map((c) => c._id);
      await Promise.all([
        this.attempts.deleteMany({ child: { $in: childIds } }),
        this.events.deleteMany({ child: { $in: childIds } }),
        this.courses.updateMany({}, { $pull: { children: { $in: childIds } } }),
        this.quizzes.updateMany({}, { $pull: { children: { $in: childIds } } }),
        this.children.deleteMany({ parent: id }),
        this.meetings.deleteMany({ parent: id }),
        this.ratings.deleteMany({ parent: id }),
      ]);
    }
    if (user.role === Role.TEACHER) {
      await Promise.all([
        this.children.updateMany({}, { $pull: { teachers: id } }),
        this.events.deleteMany({ teacher: id }),
        this.ratings.deleteMany({ teacher: id }),
      ]);
    }
    if (user.role === Role.MENTOR) {
      await Promise.all([
        this.users.updateMany({ mentor: id }, { $unset: { mentor: 1 } }),
        this.meetings.deleteMany({ mentor: id }),
      ]);
    }
    await this.messages.deleteMany({ $or: [{ sender: id }, { receiver: id }] });
    await user.deleteOne();
  }

  // ---------- own account ----------

  async updateMe(requester: AuthUser, dto: UpdateProfileDto) {
    const user = await this.findById(requester.id);
    if (dto.email && dto.email.toLowerCase() !== user.email) {
      await this.assertEmailFree(dto.email, requester.id);
    }
    if (user.role !== Role.TEACHER) {
      delete dto.qualifications;
      delete dto.expertise;
    }
    Object.assign(user, dto);
    return user.save();
  }

  async deleteMe(requester: AuthUser) {
    if (requester.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('The super admin account cannot be deleted');
    }
    await this.deleteWithRelations(await this.findById(requester.id));
    return { deleted: true };
  }

  async myMentor(requester: AuthUser) {
    const mentorId = await this.access.mentorIdOfParent(requester.id);
    if (!mentorId) return null;
    return this.users.findById(mentorId);
  }
}
