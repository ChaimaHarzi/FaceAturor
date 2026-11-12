import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { isAdmin, Role } from '../common/enums';
import { MailService } from '../mail/mail.service';
import { User } from '../users/user.schema';
import { UsersService } from '../users/users.service';
import { AvailabilityQuery, CreateMeetingDto, UpdateMeetingDto } from './dto';
import { Meeting, MeetingDocument } from './meeting.schema';

const POPULATE = [
  { path: 'parent', select: 'name email phone availableFrom availableTo' },
  { path: 'mentor', select: 'name email phone' },
  { path: 'createdBy', select: 'name email' },
];

const DEFAULT_DURATION = 60;
const MAX_DURATION_MS = 240 * 60_000;

@Injectable()
export class MeetingsService {
  constructor(
    @InjectModel(Meeting.name) private readonly meetings: Model<Meeting>,
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly usersService: UsersService,
    private readonly mail: MailService,
  ) {}

  list(user: AuthUser) {
    const filter: FilterQuery<Meeting> = {};
    if (user.role === Role.MENTOR) filter.mentor = user.id;
    else if (user.role === Role.PARENT) filter.parent = user.id;
    else if (!isAdmin(user.role)) throw new ForbiddenException();
    return this.meetings.find(filter).populate(POPULATE).sort({ date: 1 });
  }

  async findOne(user: AuthUser, id: string) {
    const meeting = await this.meetings.findById(id).populate(POPULATE);
    if (!meeting) throw new NotFoundException('Meeting not found');
    const participant = [meeting.parent, meeting.mentor].some(
      (p: any) => String(p?._id ?? p) === user.id,
    );
    if (!isAdmin(user.role) && !participant) throw new ForbiddenException();
    return meeting;
  }

  /** "Verify Mentor Availability": no overlapping meeting for the mentor. */
  async checkAvailability({ mentorId, date, durationMinutes, excludeId }: AvailabilityQuery) {
    const start = new Date(date);
    const end = new Date(start.getTime() + (durationMinutes ?? DEFAULT_DURATION) * 60_000);
    // Candidates may start up to MAX_DURATION before our start and still overlap.
    const candidates = await this.meetings
      .find({
        mentor: mentorId,
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        date: { $lt: end, $gt: new Date(start.getTime() - MAX_DURATION_MS) },
      })
      .lean();
    const conflict = candidates.find(
      (m) => new Date(m.date).getTime() + m.durationMinutes * 60_000 > start.getTime(),
    );
    return {
      available: !conflict,
      conflict: conflict
        ? { id: String(conflict._id), title: conflict.title, date: conflict.date }
        : null,
    };
  }

  private async assertAvailable(query: AvailabilityQuery) {
    const { available, conflict } = await this.checkAvailability(query);
    if (!available) {
      throw new ConflictException(
        `The mentor already has "${conflict!.title}" at ${new Date(conflict!.date).toLocaleString('fr-TN')}`,
      );
    }
  }

  async create(user: AuthUser, dto: CreateMeetingDto) {
    const parent = await this.usersService.ensureRole(dto.parent, Role.PARENT, 'parent');
    await this.usersService.ensureRole(dto.mentor, Role.MENTOR, 'mentor');
    await this.assertAvailable({
      mentorId: dto.mentor,
      date: dto.date,
      durationMinutes: dto.durationMinutes,
    });

    const meeting = await this.meetings.create({ ...dto, createdBy: user.id });
    // The mentor of the meeting follows this family from now on.
    if (!parent.mentor) await this.users.updateOne({ _id: parent._id }, { mentor: dto.mentor });

    await meeting.populate(POPULATE);
    await this.notify(meeting, 'New meeting scheduled');
    return meeting;
  }

  async update(id: string, dto: UpdateMeetingDto) {
    const meeting = await this.meetings.findById(id);
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (dto.parent) await this.usersService.ensureRole(dto.parent, Role.PARENT, 'parent');
    if (dto.mentor) await this.usersService.ensureRole(dto.mentor, Role.MENTOR, 'mentor');
    if (dto.date || dto.mentor || dto.durationMinutes) {
      await this.assertAvailable({
        mentorId: dto.mentor ?? String(meeting.mentor),
        date: dto.date ?? meeting.date.toISOString(),
        durationMinutes: dto.durationMinutes ?? meeting.durationMinutes,
        excludeId: id,
      });
    }
    Object.assign(meeting, dto);
    await meeting.save();
    await meeting.populate(POPULATE);
    await this.notify(meeting, 'Meeting updated');
    return meeting;
  }

  async remove(id: string) {
    const meeting = await this.meetings.findById(id).populate(POPULATE);
    if (!meeting) throw new NotFoundException('Meeting not found');
    await meeting.deleteOne();
    await this.notify(meeting, 'Meeting cancelled', true);
    return { deleted: true };
  }

  private async notify(meeting: MeetingDocument, subject: string, cancelled = false) {
    const parent = meeting.parent as unknown as User;
    const mentor = meeting.mentor as unknown as User;
    const when = new Date(meeting.date).toLocaleString('fr-TN', { timeZone: 'Africa/Tunis' });
    const body = cancelled
      ? `<p>The meeting "<b>${meeting.title}</b>" planned on <b>${when}</b> has been cancelled.</p>`
      : `<p>Meeting: <b>${meeting.title}</b><br/>Date: <b>${when}</b> (${meeting.durationMinutes} min)<br/>Parent: ${parent.name}<br/>Mentor: ${mentor.name}</p>`;
    const action = cancelled ? undefined : { label: 'Join the meeting', url: meeting.link };
    await Promise.all(
      [parent, mentor].map((p) =>
        this.mail.send(p.email, subject, this.mail.layout(subject, body, action)),
      ),
    );
  }
}
