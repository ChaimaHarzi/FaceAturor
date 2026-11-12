import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { AccessService } from '../database/access.service';
import { User } from '../users/user.schema';
import { Message } from './message.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private readonly messages: Model<Message>,
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly access: AccessService,
  ) {}

  private async assertCanTalk(user: AuthUser, otherId: string) {
    const contacts = await this.access.contactIds(user);
    if (!contacts.includes(otherId)) {
      throw new ForbiddenException('You cannot message this user');
    }
  }

  /** Allowed contacts with their last message and unread count, most recent first. */
  async contacts(user: AuthUser) {
    const ids = await this.access.contactIds(user);
    const me = new Types.ObjectId(user.id);
    const objectIds = ids.map((id) => new Types.ObjectId(id));

    const [people, last, unread] = await Promise.all([
      this.users.find({ _id: { $in: objectIds } }, 'name email role gender').lean(),
      this.messages.aggregate<{
        _id: Types.ObjectId;
        content: string;
        createdAt: Date;
        sender: Types.ObjectId;
      }>([
        {
          $match: {
            $or: [
              { sender: me, receiver: { $in: objectIds } },
              { receiver: me, sender: { $in: objectIds } },
            ],
          },
        },
        { $sort: { createdAt: -1 } },
        { $addFields: { other: { $cond: [{ $eq: ['$sender', me] }, '$receiver', '$sender'] } } },
        {
          $group: {
            _id: '$other',
            content: { $first: '$content' },
            createdAt: { $first: '$createdAt' },
            sender: { $first: '$sender' },
          },
        },
      ]),
      this.messages.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { receiver: me, sender: { $in: objectIds }, readAt: null } },
        { $group: { _id: '$sender', count: { $sum: 1 } } },
      ]),
    ]);

    const lastBy = new Map(last.map((m) => [String(m._id), m]));
    const unreadBy = new Map(unread.map((u) => [String(u._id), u.count]));
    return people
      .map((p) => {
        const message = lastBy.get(String(p._id));
        return {
          user: { id: String(p._id), name: p.name, email: p.email, role: p.role, gender: p.gender },
          lastMessage: message
            ? {
                content: message.content,
                createdAt: message.createdAt,
                mine: String(message.sender) === user.id,
              }
            : null,
          unread: unreadBy.get(String(p._id)) ?? 0,
        };
      })
      .sort((a, b) => {
        const ta = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const tb = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return tb - ta || a.user.name.localeCompare(b.user.name);
      });
  }

  async unreadCount(user: AuthUser) {
    return { count: await this.messages.countDocuments({ receiver: user.id, readAt: null }) };
  }

  /** Conversation with one user; marks received messages as read. */
  async thread(user: AuthUser, otherId: string) {
    await this.assertCanTalk(user, otherId);
    await this.messages.updateMany(
      { sender: otherId, receiver: user.id, readAt: null },
      { readAt: new Date() },
    );
    return this.messages
      .find({
        $or: [
          { sender: user.id, receiver: otherId },
          { sender: otherId, receiver: user.id },
        ],
      })
      .sort({ createdAt: 1 })
      .limit(500);
  }

  async send(user: AuthUser, receiver: string, content: string) {
    await this.assertCanTalk(user, receiver);
    return this.messages.create({ sender: user.id, receiver, content });
  }
}
