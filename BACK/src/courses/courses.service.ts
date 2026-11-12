import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { isAdmin, Role } from '../common/enums';
import { AccessService } from '../database/access.service';
import { CloudinaryService } from './cloudinary.service';
import { Course } from './course.schema';
import { CreateCourseDto, ListByChildQuery, UpdateCourseDto } from './dto';

const POPULATE = [
  { path: 'teacher', select: 'name email' },
  { path: 'children', select: 'firstName lastName grade' },
];

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private readonly courses: Model<Course>,
    private readonly access: AccessService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async list(user: AuthUser, { childId }: ListByChildQuery) {
    const filter: FilterQuery<Course> = {};
    if (childId) {
      await this.access.getChild(user, childId);
      filter.children = childId;
    } else if (user.role === Role.TEACHER) {
      filter.teacher = user.id;
    } else if (user.role === Role.PARENT) {
      filter.children = { $in: await this.access.childIdsOfParent(user.id) };
    } else if (!isAdmin(user.role)) {
      throw new ForbiddenException();
    }
    return this.courses.find(filter).populate(POPULATE).sort({ createdAt: -1 });
  }

  /** A teacher can only target students they are assigned to. */
  private async assertOwnStudents(teacherId: string, childIds: string[] = []) {
    const mine = await this.access.childIdsOfTeacher(teacherId);
    if (childIds.some((id) => !mine.includes(id))) {
      throw new BadRequestException('You can only share content with your own students');
    }
  }

  private async getOwned(user: AuthUser, id: string) {
    const course = await this.courses.findById(id);
    if (!course) throw new NotFoundException('Course not found');
    if (String(course.teacher) !== user.id && !isAdmin(user.role)) throw new ForbiddenException();
    return course;
  }

  async create(user: AuthUser, dto: CreateCourseDto, file?: Express.Multer.File) {
    await this.assertOwnStudents(user.id, dto.children);
    if (!file && !dto.link) throw new BadRequestException('Add a file or a link');
    const uploaded = file ? await this.cloudinary.upload(file) : undefined;
    const course = await this.courses.create({
      ...dto,
      teacher: user.id,
      fileUrl: uploaded?.secure_url,
      fileName: file?.originalname,
    });
    return course.populate(POPULATE);
  }

  async update(user: AuthUser, id: string, dto: UpdateCourseDto, file?: Express.Multer.File) {
    const course = await this.getOwned(user, id);
    if (dto.children) await this.assertOwnStudents(String(course.teacher), dto.children);
    Object.assign(course, dto);
    if (file) {
      const uploaded = await this.cloudinary.upload(file);
      course.fileUrl = uploaded.secure_url;
      course.fileName = file.originalname;
    }
    if (!course.fileUrl && !course.link) throw new BadRequestException('Add a file or a link');
    await course.save();
    return course.populate(POPULATE);
  }

  async remove(user: AuthUser, id: string) {
    const course = await this.getOwned(user, id);
    await course.deleteOne();
    return { deleted: true };
  }
}
