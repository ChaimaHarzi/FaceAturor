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
import { CreateEventDto, ListEventsQuery, UpdateEventDto } from './dto';
import { SessionEvent } from './event.schema';

const POPULATE = [
  { path: 'teacher', select: 'name email' },
  { path: 'child', select: 'firstName lastName grade parent' },
];

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(SessionEvent.name) private readonly events: Model<SessionEvent>,
    private readonly access: AccessService,
  ) {}

  async list(user: AuthUser, { childId, from, to }: ListEventsQuery) {
    const filter: FilterQuery<SessionEvent> = {};
    if (childId) {
      await this.access.getChild(user, childId);
      filter.child = childId;
    } else if (user.role === Role.TEACHER) {
      filter.teacher = user.id;
    } else if (!isAdmin(user.role)) {
      filter.child = { $in: (await this.access.visibleChildIds(user)) ?? [] };
    }
    if (from || to) {
      filter.start = {};
      if (from) filter.start.$gte = new Date(from);
      if (to) filter.start.$lte = new Date(to);
    }
    return this.events.find(filter).populate(POPULATE).sort({ start: 1 });
  }

  private validateDates(start: Date, end: Date) {
    if (end <= start) throw new BadRequestException('The session must end after it starts');
  }

  private async assertTeachesChild(user: AuthUser, childId: string) {
    const child = await this.access.getChild(user, childId);
    if (!child.teachers.some((t) => String(t) === user.id)) {
      throw new BadRequestException('This student is not assigned to you');
    }
  }

  private async getOwned(user: AuthUser, id: string) {
    const event = await this.events.findById(id);
    if (!event) throw new NotFoundException('Session not found');
    if (String(event.teacher) !== user.id) throw new ForbiddenException();
    return event;
  }

  async create(user: AuthUser, dto: CreateEventDto) {
    await this.assertTeachesChild(user, dto.child);
    this.validateDates(new Date(dto.start), new Date(dto.end));
    const event = await this.events.create({ ...dto, teacher: user.id });
    return event.populate(POPULATE);
  }

  async update(user: AuthUser, id: string, dto: UpdateEventDto) {
    const event = await this.getOwned(user, id);
    if (dto.child) await this.assertTeachesChild(user, dto.child);
    Object.assign(event, dto);
    this.validateDates(event.start, event.end);
    await event.save();
    return event.populate(POPULATE);
  }

  async remove(user: AuthUser, id: string) {
    const event = await this.getOwned(user, id);
    await event.deleteOne();
    return { deleted: true };
  }
}
