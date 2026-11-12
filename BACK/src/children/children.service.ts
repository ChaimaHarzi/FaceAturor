import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { isAdmin, Role } from '../common/enums';
import { AccessService } from '../database/access.service';
import { Course } from '../courses/course.schema';
import { SessionEvent } from '../events/event.schema';
import { Quiz, QuizAttempt } from '../quizzes/quiz.schema';
import { User } from '../users/user.schema';
import { Child } from './child.schema';
import { AssignTeachersDto, CreateChildDto, ListChildrenQuery, UpdateChildDto } from './dto';

const POPULATE = [
  { path: 'teachers', select: 'name email phone expertise' },
  { path: 'parent', select: 'name email phone' },
];

@Injectable()
export class ChildrenService {
  constructor(
    @InjectModel(Child.name) private readonly children: Model<Child>,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Course.name) private readonly courses: Model<Course>,
    @InjectModel(Quiz.name) private readonly quizzes: Model<Quiz>,
    @InjectModel(QuizAttempt.name) private readonly attempts: Model<QuizAttempt>,
    @InjectModel(SessionEvent.name) private readonly events: Model<SessionEvent>,
    private readonly access: AccessService,
  ) {}

  async list(user: AuthUser, query: ListChildrenQuery) {
    const filter: FilterQuery<Child> = {};
    const visible = await this.access.visibleChildIds(user);
    if (visible) filter._id = { $in: visible };
    if (query.parentId) filter.parent = query.parentId;
    return this.children.find(filter).populate(POPULATE).sort({ firstName: 1 });
  }

  async findOne(user: AuthUser, id: string) {
    const child = await this.access.getChild(user, id);
    return child.populate(POPULATE);
  }

  create(user: AuthUser, dto: CreateChildDto) {
    return this.children.create({ ...dto, parent: user.id });
  }

  private async getOwned(user: AuthUser, id: string) {
    const child = await this.access.getChild(user, id);
    if (!isAdmin(user.role) && String(child.parent) !== user.id) {
      throw new ForbiddenException('Only the parent can modify this profile');
    }
    return child;
  }

  async update(user: AuthUser, id: string, dto: UpdateChildDto) {
    const child = await this.getOwned(user, id);
    Object.assign(child, dto);
    await child.save();
    return child.populate(POPULATE);
  }

  async remove(user: AuthUser, id: string) {
    const child = await this.getOwned(user, id);
    await Promise.all([
      this.attempts.deleteMany({ child: child._id }),
      this.events.deleteMany({ child: child._id }),
      this.courses.updateMany({}, { $pull: { children: child._id } }),
      this.quizzes.updateMany({}, { $pull: { children: child._id } }),
    ]);
    await child.deleteOne();
    return { deleted: true };
  }

  /** The mentor (or an admin) matches the child with suitable teachers. */
  async assignTeachers(user: AuthUser, id: string, dto: AssignTeachersDto) {
    const child = await this.access.getChild(user, id);
    if (![Role.MENTOR, Role.SUPER_ADMIN, Role.ADMIN].includes(user.role)) {
      throw new ForbiddenException('Only the mentor or an admin can assign teachers');
    }
    const unique = [...new Set(dto.teacherIds)];
    const count = await this.users.countDocuments({ _id: { $in: unique }, role: Role.TEACHER });
    if (count !== unique.length)
      throw new BadRequestException('Some selected teachers do not exist');
    child.teachers = unique as any;
    await child.save();
    return child.populate(POPULATE);
  }
}
