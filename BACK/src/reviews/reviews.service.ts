import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Model, Types } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { AccessService } from '../database/access.service';
import { Feedback, Rating } from './review.schemas';

export class CreateFeedbackDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class RateTeacherDto {
  @IsMongoId()
  teacher: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Feedback.name) private readonly feedback: Model<Feedback>,
    @InjectModel(Rating.name) private readonly ratings: Model<Rating>,
    private readonly access: AccessService,
  ) {}

  // ---------- platform feedback ----------

  createFeedback(user: AuthUser, dto: CreateFeedbackDto) {
    return this.feedback.create({ ...dto, parent: user.id });
  }

  async listFeedback() {
    const [items, [summary]] = await Promise.all([
      this.feedback.find().populate('parent', 'name email').sort({ createdAt: -1 }),
      this.feedback.aggregate([
        { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);
    return {
      average: summary ? Math.round(summary.average * 10) / 10 : null,
      count: summary?.count ?? 0,
      items,
    };
  }

  myFeedback(user: AuthUser) {
    return this.feedback.find({ parent: user.id }).sort({ createdAt: -1 });
  }

  // ---------- teacher evaluation ----------

  /** One rating per parent and teacher; rating again updates it. */
  async rateTeacher(user: AuthUser, dto: RateTeacherDto) {
    const teachers = await this.access.teacherIdsOfParent(user.id);
    if (!teachers.includes(dto.teacher)) {
      throw new BadRequestException('You can only evaluate the teachers of your children');
    }
    return this.ratings.findOneAndUpdate(
      { parent: user.id, teacher: dto.teacher },
      { score: dto.score, description: dto.description },
      { upsert: true, new: true, runValidators: true },
    );
  }

  myRatings(user: AuthUser) {
    return this.ratings.find({ parent: user.id });
  }

  async teacherRatings(teacherId: string) {
    const [items, [summary]] = await Promise.all([
      this.ratings.find({ teacher: teacherId }).populate('parent', 'name').sort({ updatedAt: -1 }),
      this.ratings.aggregate([
        { $match: { teacher: new Types.ObjectId(teacherId) } },
        { $group: { _id: null, average: { $avg: '$score' }, count: { $sum: 1 } } },
      ]),
    ]);
    return {
      average: summary ? Math.round(summary.average * 10) / 10 : null,
      count: summary?.count ?? 0,
      items,
    };
  }
}
