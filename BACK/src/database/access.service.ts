import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { isAdmin, Role } from '../common/enums';
import { Child, ChildDocument } from '../children/child.schema';
import { User } from '../users/user.schema';

const ids = (values: Array<Types.ObjectId | string | undefined | null>) => [
  ...new Set(values.filter(Boolean).map(String)),
];

/**
 * Relationship rules between actors, from the report:
 * parent → children → teachers, parent → mentor, admins oversee everything.
 */
@Injectable()
export class AccessService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Child.name) private readonly children: Model<Child>,
  ) {}

  async childIdsOfParent(parentId: string) {
    const rows = await this.children.find({ parent: parentId }, '_id').lean();
    return ids(rows.map((c) => c._id));
  }

  async childIdsOfTeacher(teacherId: string) {
    const rows = await this.children.find({ teachers: teacherId }, '_id').lean();
    return ids(rows.map((c) => c._id));
  }

  async teacherIdsOfParent(parentId: string) {
    const rows = await this.children.find({ parent: parentId }, 'teachers').lean();
    return ids(rows.flatMap((c) => c.teachers));
  }

  async parentIdsOfTeacher(teacherId: string) {
    const rows = await this.children.find({ teachers: teacherId }, 'parent').lean();
    return ids(rows.map((c) => c.parent));
  }

  async parentIdsOfMentor(mentorId: string) {
    const rows = await this.users.find({ role: Role.PARENT, mentor: mentorId }, '_id').lean();
    return ids(rows.map((u) => u._id));
  }

  async mentorIdOfParent(parentId: string) {
    const parent = await this.users.findById(parentId, 'mentor').lean();
    return parent?.mentor ? String(parent.mentor) : undefined;
  }

  /** Loads a child and checks the current user may see it. */
  async getChild(user: AuthUser, childId: string): Promise<ChildDocument> {
    const child = await this.children.findById(childId);
    if (!child) throw new NotFoundException('Child not found');
    if (!(await this.canSeeChild(user, child))) {
      throw new ForbiddenException('You cannot access this child');
    }
    return child;
  }

  async canSeeChild(user: AuthUser, child: Child) {
    if (isAdmin(user.role)) return true;
    switch (user.role) {
      case Role.PARENT:
        return String(child.parent) === user.id;
      case Role.TEACHER:
        return child.teachers.some((t) => String(t) === user.id);
      case Role.MENTOR:
        return (await this.mentorIdOfParent(String(child.parent))) === user.id;
      default:
        return false;
    }
  }

  /** Children visible to the user (undefined = no restriction). */
  async visibleChildIds(user: AuthUser): Promise<string[] | undefined> {
    switch (user.role) {
      case Role.PARENT:
        return this.childIdsOfParent(user.id);
      case Role.TEACHER:
        return this.childIdsOfTeacher(user.id);
      case Role.MENTOR: {
        const parents = await this.parentIdsOfMentor(user.id);
        const rows = await this.children.find({ parent: { $in: parents } }, '_id').lean();
        return ids(rows.map((c) => c._id));
      }
      default:
        return undefined;
    }
  }

  /**
   * Who a user may exchange messages with (report, sprints 2 and 5):
   * admin ↔ mentor/teacher, mentor ↔ teacher/assigned parents,
   * teacher ↔ parents of their students, parent ↔ mentor/teachers of their children.
   */
  async contactIds(user: AuthUser): Promise<string[]> {
    const byRole = async (...roles: Role[]) => {
      const rows = await this.users
        .find({ role: { $in: roles }, accountStatus: true }, '_id')
        .lean();
      return ids(rows.map((u) => u._id));
    };

    let result: string[];
    switch (user.role) {
      case Role.SUPER_ADMIN:
      case Role.ADMIN:
        result = await byRole(Role.MENTOR, Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN);
        break;
      case Role.MENTOR:
        result = [
          ...(await byRole(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)),
          ...(await this.parentIdsOfMentor(user.id)),
        ];
        break;
      case Role.TEACHER:
        result = [
          ...(await byRole(Role.ADMIN, Role.SUPER_ADMIN, Role.MENTOR)),
          ...(await this.parentIdsOfTeacher(user.id)),
        ];
        break;
      case Role.PARENT:
        result = [
          await this.mentorIdOfParent(user.id),
          ...(await this.teacherIdsOfParent(user.id)),
        ].filter(Boolean) as string[];
        break;
      default:
        result = [];
    }
    return ids(result).filter((id) => id !== user.id);
  }
}
