/**
 * npm run seed            -> creates the super admin (from .env) and cleans legacy data
 * npm run seed -- --demo  -> also inserts a complete demo dataset
 */
import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { AppModule } from './app.module';
import { Gender, Role } from './common/enums';
import { Child } from './children/child.schema';
import { Course } from './courses/course.schema';
import { SessionEvent } from './events/event.schema';
import { Meeting } from './meetings/meeting.schema';
import { Message } from './messages/message.schema';
import { Payment } from './payments/payment.schema';
import { Quiz, QuizAttempt } from './quizzes/quiz.schema';
import { Feedback, Rating } from './reviews/review.schemas';
import { User } from './users/user.schema';
import { hashPassword } from './users/users.service';

// Plain console output: Nest's logger is silenced while the app context boots.
const logger = {
  log: (message: string) => console.log(`[seed] ${message}`),
  error: (error: unknown) => console.error('[seed]', error),
};
const DEMO_PASSWORD = 'Demo1234';

const inDays = (days: number, hour = 17) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
};

export async function seed(app: INestApplicationContext, options: { demo?: boolean } = {}) {
  const config = app.get(ConfigService);
  const connection = app.get<Connection>(getConnectionToken());
  const model = <T>(name: string) => app.get<Model<T>>(getModelToken(name));
  const users = model<User>(User.name);

  // 1. Legacy documents from the first version have an incompatible shape.
  const legacy = await Promise.all([
    model<Meeting>(Meeting.name).deleteMany({
      $or: [{ parent: { $type: 'string' } }, { mentor: { $type: 'string' } }],
    }),
    model<Message>(Message.name).deleteMany({ sender: { $exists: false } }),
    model<Payment>(Payment.name).deleteMany({ reference: { $exists: false } }),
  ]);
  const removed = legacy.reduce((n, r) => n + r.deletedCount, 0);
  if (removed) logger.log(`Removed ${removed} legacy documents`);
  if ((await connection.db!.listCollections({ name: 'parents' }).toArray()).length) {
    await connection.db!.dropCollection('parents');
    logger.log('Dropped unused "parents" collection');
  }
  await migrateLegacyFields(connection);

  // 2. Super admin.
  const email = config.get('SEED_SUPERADMIN_EMAIL', 'superadmin@faceatutor.tn');
  if (!(await users.exists({ role: Role.SUPER_ADMIN }))) {
    const password = config.get('SEED_SUPERADMIN_PASSWORD', 'SuperAdmin123');
    await users.create({
      name: config.get('SEED_SUPERADMIN_NAME', 'Super Admin'),
      email,
      password: await hashPassword(password),
      role: Role.SUPER_ADMIN,
      phone: '',
      emailVerified: true,
    });
    logger.log(`Super admin created: ${email} / ${password} (change this password!)`);
  } else {
    logger.log('Super admin already exists');
  }

  if (options.demo) await demo(model);
}

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  await seed(app, { demo: process.argv.includes('--demo') });
  await app.close();
}

/** Brings documents created by the first version to the current schema. */
async function migrateLegacyFields(connection: Connection) {
  const db = connection.db!;
  const toObjectId = (input: string) => ({
    $convert: { input, to: 'objectId', onError: input, onNull: null },
  });

  // References were stored as strings: convert them to real ObjectIds.
  const refs: Array<{ collection: string; fields?: string[]; arrays?: string[] }> = [
    { collection: 'users', fields: ['mentor'] },
    { collection: 'children', fields: ['parent'], arrays: ['teachers'] },
    { collection: 'courses', fields: ['teacher'], arrays: ['children'] },
    { collection: 'sessionevents', fields: ['teacher', 'child'] },
    { collection: 'messages', fields: ['sender', 'receiver'] },
    { collection: 'payments', fields: ['parent', 'teacher', 'child'] },
    { collection: 'quizzes', fields: ['teacher'], arrays: ['children'] },
    { collection: 'quizattempts', fields: ['quiz', 'child'] },
    { collection: 'feedbacks', fields: ['parent'] },
    { collection: 'ratings', fields: ['parent', 'teacher'] },
  ];
  let converted = 0;
  for (const { collection, fields = [], arrays = [] } of refs) {
    for (const field of fields) {
      const r = await db
        .collection(collection)
        .updateMany({ [field]: { $type: 'string' } }, [
          { $set: { [field]: toObjectId(`$${field}`) } },
        ]);
      converted += r.modifiedCount;
    }
    for (const field of arrays) {
      const r = await db
        .collection(collection)
        .updateMany({ [field]: { $elemMatch: { $type: 'string' } } }, [
          { $set: { [field]: { $map: { input: `$${field}`, in: toObjectId('$$this') } } } },
        ]);
      converted += r.modifiedCount;
    }
  }
  if (converted) logger.log(`Converted string references to ObjectId in ${converted} documents`);

  // Renamed fields.
  const renamed = await Promise.all([
    db
      .collection('children')
      .updateMany({ grade: { $exists: false }, class: { $exists: true } }, [
        { $set: { grade: '$class' } },
        { $unset: 'class' },
      ]),
    db
      .collection('courses')
      .updateMany({ title: { $exists: false }, name: { $exists: true } }, [
        { $set: { title: '$name', fileUrl: '$path', subject: 'General' } },
        { $unset: ['name', 'path'] },
      ]),
    db.collection('users').updateMany({ firstMeetingDate: { $exists: true } }, [
      {
        $set: {
          availableFrom: {
            $convert: { input: '$firstMeetingDate', to: 'date', onError: null, onNull: null },
          },
          availableTo: {
            $convert: { input: '$firstMeetingDate', to: 'date', onError: null, onNull: null },
          },
        },
      },
      { $unset: 'firstMeetingDate' },
    ]),
  ]);
  const count = renamed.reduce((n, r) => n + r.modifiedCount, 0);
  if (count) logger.log(`Migrated ${count} documents to the new field names`);
}

async function demo(model: <T>(name: string) => Model<T>) {
  const users = model<User>(User.name);
  if (await users.exists({ email: 'admin@demo.tn' })) {
    logger.log('Demo data already present');
    return;
  }
  const password = await hashPassword(DEMO_PASSWORD);
  const make = (name: string, email: string, role: Role, extra: Partial<User> = {}) =>
    users.create({
      name,
      email,
      role,
      password,
      phone: '+216 20 000 000',
      emailVerified: true,
      ...extra,
    });

  await make('Ahmed Aloui', 'admin@demo.tn', Role.ADMIN);
  const mentor = await make('Fatma Ben Salah', 'mentor@demo.tn', Role.MENTOR, {
    gender: Gender.FEMALE,
  });
  await make('Aymen Trabelsi', 'mentor2@demo.tn', Role.MENTOR);
  const math = await make('Samir Chatbouri', 'teacher@demo.tn', Role.TEACHER, {
    expertise: ['Mathematics', 'Physics'],
    qualifications: ['Master in Applied Mathematics', '8 years of tutoring'],
    bio: 'Patient teacher who makes maths concrete with real-life examples.',
  });
  const english = await make('Sonia Gharbi', 'teacher2@demo.tn', Role.TEACHER, {
    gender: Gender.FEMALE,
    expertise: ['English', 'French'],
    qualifications: ['CAPES English', 'Cambridge CELTA'],
    bio: 'Language teacher focused on speaking confidence.',
  });
  const science = await make('Walid Mejri', 'teacher3@demo.tn', Role.TEACHER, {
    expertise: ['Science', 'Computer science'],
    qualifications: ['Engineer, ENIT', 'Robotics club coach'],
  });
  const parent = await make('Marwen Saadi', 'parent@demo.tn', Role.PARENT, {
    mentor: mentor._id as any,
  });
  await make('Omar Mohamed', 'pending@demo.tn', Role.PARENT, {
    accountStatus: false,
    availableFrom: inDays(2),
    availableTo: inDays(6),
  });

  const children = model<Child>(Child.name);
  const sara = await children.create({
    parent: parent._id,
    firstName: 'Sara',
    lastName: 'Saadi',
    gender: Gender.FEMALE,
    dateOfBirth: new Date('2015-03-12'),
    grade: '3rd grade',
    teachers: [math._id, english._id],
  });
  const tawfik = await children.create({
    parent: parent._id,
    firstName: 'Tawfik',
    lastName: 'Saadi',
    gender: Gender.MALE,
    dateOfBirth: new Date('2013-09-02'),
    grade: '5th grade',
    specialNeeds: 'Mild dyslexia',
    teachers: [math._id, science._id],
  });

  await model<Course>(Course.name).create([
    {
      teacher: math._id,
      title: 'Fractions made easy',
      subject: 'Mathematics',
      link: 'https://www.khanacademy.org/math/arithmetic/fraction-arithmetic',
      children: [sara._id, tawfik._id],
    },
    {
      teacher: english._id,
      title: 'Present simple',
      subject: 'English',
      link: 'https://learnenglishkids.britishcouncil.org/grammar-practice/present-simple',
      children: [sara._id],
    },
    {
      teacher: science._id,
      title: 'The water cycle',
      subject: 'Science',
      description: 'Video and short summary',
      link: 'https://www.youtube.com/watch?v=al-do-HGuIk',
      children: [tawfik._id],
    },
  ]);

  const [quiz] = await model<Quiz>(Quiz.name).create([
    {
      teacher: math._id,
      title: 'Quiz 1 – Basics',
      subject: 'Mathematics',
      children: [sara._id, tawfik._id],
      deadline: inDays(10),
      questions: [
        { text: 'What is 7 + 5?', choices: ['10', '12', '14'], correctIndex: 1 },
        { text: 'What is half of 18?', choices: ['8', '9', '6'], correctIndex: 1 },
        { text: 'Which fraction is bigger?', choices: ['1/2', '1/3', '1/4'], correctIndex: 0 },
      ],
    },
    {
      teacher: science._id,
      title: 'Planets',
      subject: 'Science',
      children: [tawfik._id],
      questions: [
        {
          text: 'Which planet is known as the Red Planet?',
          choices: ['Mars', 'Jupiter', 'Venus'],
          correctIndex: 0,
        },
        {
          text: 'Which is the largest planet?',
          choices: ['Earth', 'Jupiter', 'Saturn'],
          correctIndex: 1,
        },
      ],
    },
  ]);
  await model<QuizAttempt>(QuizAttempt.name).create({
    quiz: quiz._id,
    child: tawfik._id,
    answers: [1, 1, 2],
    score: 2,
    total: 3,
  });

  await model<SessionEvent>(SessionEvent.name).create([
    {
      teacher: math._id,
      child: sara._id,
      subject: 'Mathematics',
      start: inDays(1),
      end: inDays(1, 18),
      link: 'https://zoom.us/j/1000000001',
    },
    {
      teacher: english._id,
      child: sara._id,
      subject: 'English',
      start: inDays(2, 15),
      end: inDays(2, 16),
      link: 'https://zoom.us/j/1000000002',
    },
    {
      teacher: math._id,
      child: tawfik._id,
      subject: 'Mathematics',
      start: inDays(3),
      end: inDays(3, 18),
      link: 'https://zoom.us/j/1000000003',
    },
  ]);

  const admin = await users.findOne({ email: 'admin@demo.tn' });
  await model<Meeting>(Meeting.name).create([
    {
      title: 'Follow-up meeting',
      parent: parent._id,
      mentor: mentor._id,
      createdBy: admin!._id,
      date: inDays(4, 10),
      link: 'https://zoom.us/j/2000000001',
    },
  ]);

  await model<Payment>(Payment.name).create([
    {
      parent: parent._id,
      teacher: math._id,
      child: sara._id,
      formation: 'Mathematics – term 1',
      amount: 120,
      reference: 'PAY-DEMO-0001',
    },
    {
      parent: parent._id,
      teacher: english._id,
      child: sara._id,
      formation: 'English – term 1',
      amount: 90,
      reference: 'PAY-DEMO-0002',
    },
  ]);

  await model<Message>(Message.name).create([
    { sender: parent._id, receiver: math._id, content: 'Hello, how is Sara doing with fractions?' },
    {
      sender: math._id,
      receiver: parent._id,
      content: 'She is improving a lot! We will practise again on Thursday.',
    },
    {
      sender: mentor._id,
      receiver: parent._id,
      content: 'Welcome to Faceatutor, do not hesitate to contact me.',
    },
  ]);

  await model<Feedback>(Feedback.name).create({
    parent: parent._id,
    rating: 5,
    comment: 'The mentor found the perfect teachers for my children.',
  });
  await model<Rating>(Rating.name).create({
    parent: parent._id,
    teacher: math._id,
    score: 5,
    description: 'Very pedagogical.',
  });

  logger.log(`Demo data created. Accounts (password "${DEMO_PASSWORD}"):`);
  logger.log(
    'admin@demo.tn, mentor@demo.tn, teacher@demo.tn, teacher2@demo.tn, parent@demo.tn, pending@demo.tn',
  );
}

if (require.main === module) {
  run().catch((error) => {
    logger.error(error);
    process.exit(1);
  });
}
