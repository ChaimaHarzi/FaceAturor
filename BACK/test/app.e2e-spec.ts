import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model } from 'mongoose';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Role } from '../src/common/enums';
import { MongoExceptionFilter } from '../src/common/mongo-exception.filter';
import { MailService } from '../src/mail/mail.service';
import { User } from '../src/users/user.schema';
import { hashPassword } from '../src/users/users.service';

/**
 * Full scenario of the report, from sign-up to quizzes, on an in-memory MongoDB.
 */
describe('Faceatutor API (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  const mails: Array<{ to: string; subject: string; html: string }> = [];
  const tokens: Record<string, string> = {};
  const ids: Record<string, string> = {};

  const http = () => request(app.getHttpServer());
  const as = (who: string) => ({
    get: (url: string) => http().get(url).set('Authorization', `Bearer ${tokens[who]}`),
    post: (url: string) => http().post(url).set('Authorization', `Bearer ${tokens[who]}`),
    patch: (url: string) => http().patch(url).set('Authorization', `Bearer ${tokens[who]}`),
    delete: (url: string) => http().delete(url).set('Authorization', `Bearer ${tokens[who]}`),
  });
  const login = async (who: string, email: string, password = 'Password123') => {
    const res = await http().post('/auth/login').send({ email, password }).expect(200);
    tokens[who] = res.body.accessToken;
    ids[who] = res.body.user._id;
    return res.body;
  };
  const tokenFrom = (to: string, kind: string) => {
    const mail = [...mails].reverse().find((m) => m.to === to && m.html.includes(kind));
    return mail?.html.match(/token=([a-f0-9]{64})/)?.[1];
  };

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGO_CONNECTION_STRING = mongo.getUri('faceatutor');

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new MongoExceptionFilter());
    await app.init();

    jest.spyOn(app.get(MailService), 'send').mockImplementation(async (to, subject, html) => {
      mails.push({ to, subject, html });
      return true;
    });

    await app.get<Model<User>>(getModelToken(User.name)).create({
      name: 'Super Admin',
      email: 'super@test.tn',
      password: await hashPassword('Password123'),
      role: Role.SUPER_ADMIN,
      emailVerified: true,
    });
  });

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it('protects private routes and exposes public ones', async () => {
    await http().get('/users').expect(401);
    await http().get('/public/teachers').expect(200);
  });

  it('lets the super admin create the team', async () => {
    await login('super', 'super@test.tn');
    const create = (name: string, role: Role) =>
      as('super')
        .post('/users')
        .send({ name, email: `${name}@test.tn`, password: 'Password123', role })
        .expect(201);
    await create('admin', Role.ADMIN);
    await create('mentor', Role.MENTOR);
    await create('teacher', Role.TEACHER);
    await create('teacher2', Role.TEACHER);
    const res = await as('super').get('/users?role=teacher').expect(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].password).toBeUndefined();

    await login('admin', 'admin@test.tn');
    await login('mentor', 'mentor@test.tn');
    await login('teacher', 'teacher@test.tn');
    await login('teacher2', 'teacher2@test.tn');
    // Only the super admin manages admins.
    await as('admin')
      .post('/users')
      .send({ name: 'x', email: 'x@test.tn', password: 'Password123', role: Role.ADMIN })
      .expect(403);
  });

  it('registers a parent as pending, whatever role is sent', async () => {
    const res = await http()
      .post('/auth/register')
      .send({
        name: 'Marwen Saadi',
        email: 'parent@test.tn',
        password: 'Password123',
        phone: '20000000',
        availableFrom: '2030-06-04',
        availableTo: '2030-06-08',
        role: Role.SUPER_ADMIN,
        accountStatus: true,
      })
      .expect(201);
    expect(res.body.message).toMatch(/verify/i);
    await http()
      .post('/auth/register')
      .send({
        name: 'dup',
        email: 'parent@test.tn',
        password: 'Password123',
        phone: '1',
        availableFrom: '2030-01-01',
        availableTo: '2030-01-02',
      })
      .expect(409);
  });

  it('requires the email to be verified before signing in', async () => {
    await http()
      .post('/auth/login')
      .send({ email: 'parent@test.tn', password: 'Password123' })
      .expect(403);
    const token = tokenFrom('parent@test.tn', 'verify-email');
    expect(token).toBeDefined();
    await http().post('/auth/verify-email').send({ token }).expect(200);
    await http().post('/auth/verify-email').send({ token }).expect(400); // single use

    const { user } = await login('parent', 'parent@test.tn');
    expect(user.role).toBe(Role.PARENT);
    expect(user.accountStatus).toBe(false);
    await as('parent').get('/auth/me').expect(200);
    await as('parent').get('/children').expect(403); // pending
  });

  it('schedules the first meeting and checks the mentor availability', async () => {
    const meeting = {
      title: 'First meeting',
      parent: ids.parent,
      mentor: ids.mentor,
      date: '2030-06-05T10:00:00.000Z',
      durationMinutes: 60,
      link: 'https://zoom.us/j/1',
    };
    await as('admin').post('/meetings').send(meeting).expect(201);
    const busy = await as('admin')
      .get(`/meetings/availability?mentorId=${ids.mentor}&date=2030-06-05T10:30:00.000Z`)
      .expect(200);
    expect(busy.body.available).toBe(false);
    await as('admin')
      .post('/meetings')
      .send({ ...meeting, date: '2030-06-05T10:30:00.000Z' })
      .expect(409);
    await as('admin')
      .post('/meetings')
      .send({ ...meeting, date: '2030-06-05T11:00:00.000Z' })
      .expect(201);
    expect(
      mails.some((m) => m.to === 'parent@test.tn' && m.subject === 'New meeting scheduled'),
    ).toBe(true);
    const mine = await as('mentor').get('/meetings').expect(200);
    expect(mine.body).toHaveLength(2);
  });

  it('activates the parent after the meeting', async () => {
    const pending = await as('admin').get('/users?status=pending').expect(200);
    expect(pending.body.map((u: any) => u.email)).toEqual(['parent@test.tn']);
    await as('admin')
      .patch(`/users/${ids.parent}/activate`)
      .send({ mentorId: ids.mentor })
      .expect(200);
    await as('parent').get('/children').expect(200);
    const mentor = await as('parent').get('/users/me/mentor').expect(200);
    expect(mentor.body.email).toBe('mentor@test.tn');
  });

  it('lets the parent manage children and the mentor assign teachers', async () => {
    const child = await as('parent')
      .post('/children')
      .send({
        firstName: 'Sara',
        lastName: 'Saadi',
        grade: '3rd grade',
        gender: 2,
        dateOfBirth: '2015-03-12',
        specialNeeds: 'none',
      })
      .expect(201);
    ids.child = child.body._id;
    expect(child.body.specialNeeds).toBe('none');

    await as('teacher').get(`/children/${ids.child}`).expect(403);
    await as('parent')
      .patch(`/children/${ids.child}/teachers`)
      .send({ teacherIds: [ids.teacher] })
      .expect(403);
    await as('mentor')
      .patch(`/children/${ids.child}/teachers`)
      .send({ teacherIds: [ids.teacher] })
      .expect(200);
    const visible = await as('teacher').get('/children').expect(200);
    expect(visible.body).toHaveLength(1);
    expect((await as('teacher2').get('/children').expect(200)).body).toHaveLength(0);
  });

  it('shares courses and calendar sessions with the student only', async () => {
    await as('teacher')
      .post('/courses')
      .field('title', 'Fractions')
      .field('subject', 'Maths')
      .field('link', 'https://example.com')
      .field('children', JSON.stringify([ids.child]))
      .expect(201);
    await as('teacher2')
      .post('/courses')
      .field('title', 'X')
      .field('subject', 'Y')
      .field('link', 'https://example.com')
      .field('children', JSON.stringify([ids.child]))
      .expect(400);
    await as('teacher')
      .post('/events')
      .send({
        child: ids.child,
        subject: 'Maths',
        start: '2030-07-01T15:00:00Z',
        end: '2030-07-01T16:00:00Z',
      })
      .expect(201);
    await as('teacher')
      .post('/events')
      .send({
        child: ids.child,
        subject: 'Maths',
        start: '2030-07-01T16:00:00Z',
        end: '2030-07-01T15:00:00Z',
      })
      .expect(400);

    expect((await as('parent').get(`/courses?childId=${ids.child}`).expect(200)).body).toHaveLength(
      1,
    );
    expect((await as('parent').get(`/events?childId=${ids.child}`).expect(200)).body).toHaveLength(
      1,
    );
  });

  it('runs a quiz with server-side correction', async () => {
    const quiz = await as('teacher')
      .post('/quizzes')
      .send({
        title: 'Quiz 1',
        subject: 'Maths',
        children: [ids.child],
        questions: [
          { text: '7 + 5?', choices: ['10', '12', '14'], correctIndex: 1 },
          { text: 'Red planet?', choices: ['Mars', 'Venus'], correctIndex: 0 },
        ],
      })
      .expect(201);
    ids.quiz = quiz.body._id;

    const studentView = await as('parent')
      .get(`/quizzes/${ids.quiz}?childId=${ids.child}`)
      .expect(200);
    expect(studentView.body.questions[0].correctIndex).toBeUndefined(); // answers hidden

    const result = await as('parent')
      .post(`/quizzes/${ids.quiz}/submit`)
      .send({ childId: ids.child, answers: [1, 1] })
      .expect(201);
    expect(result.body.attempt).toMatchObject({ score: 1, total: 2 });
    expect(result.body.questions[1].correctIndex).toBe(0); // correction shown after submission
    await as('parent')
      .post(`/quizzes/${ids.quiz}/submit`)
      .send({ childId: ids.child, answers: [1, 0] })
      .expect(409);

    const stats = await as('parent').get(`/stats?childId=${ids.child}`).expect(200);
    expect(stats.body).toMatchObject({
      quizzesDone: 1,
      quizzesPending: 0,
      averageScorePercent: 50,
      courses: 1,
    });
    const results = await as('teacher').get(`/quizzes/${ids.quiz}/results`).expect(200);
    expect(results.body.attempts).toHaveLength(1);
  });

  it('only allows messages between related people', async () => {
    await as('parent')
      .post('/messages')
      .send({ receiver: ids.teacher, content: 'Hello' })
      .expect(201);
    await as('parent')
      .post('/messages')
      .send({ receiver: ids.teacher2, content: 'Hello' })
      .expect(403);
    await as('parent')
      .post('/messages')
      .send({ receiver: ids.admin, content: 'Hello' })
      .expect(403);
    expect((await as('teacher').get('/messages/unread-count').expect(200)).body.count).toBe(1);
    const thread = await as('teacher').get(`/messages/with/${ids.parent}`).expect(200);
    expect(thread.body).toHaveLength(1);
    expect((await as('teacher').get('/messages/unread-count').expect(200)).body.count).toBe(0);
  });

  it('records payments, ratings and feedback', async () => {
    const payment = await as('parent')
      .post('/payments')
      .send({ child: ids.child, teacher: ids.teacher, formation: 'Maths', amount: 120 })
      .expect(201);
    expect(payment.body.reference).toMatch(/^PAY-/);
    await as('parent')
      .post('/payments')
      .send({ child: ids.child, teacher: ids.teacher2, formation: 'Maths', amount: 120 })
      .expect(400);

    await as('parent').post('/ratings').send({ teacher: ids.teacher, score: 4 }).expect(201);
    await as('parent').post('/ratings').send({ teacher: ids.teacher, score: 5 }).expect(201); // updates
    await as('parent').post('/ratings').send({ teacher: ids.teacher2, score: 1 }).expect(400);
    const teachers = await as('admin').get('/users?role=teacher').expect(200);
    expect(teachers.body.find((t: any) => t._id === ids.teacher).rating).toEqual({
      average: 5,
      count: 1,
    });

    await as('parent').post('/feedback').send({ rating: 5, comment: 'Great' }).expect(201);
    const admin = await as('admin').get('/stats').expect(200);
    expect(admin.body).toMatchObject({
      payments: { total: 120, count: 1 },
      feedback: { average: 5, count: 1 },
    });
  });

  it('resets a forgotten password', async () => {
    await http().post('/auth/forgot-password').send({ email: 'parent@test.tn' }).expect(200);
    const token = tokenFrom('parent@test.tn', 'reset-password');
    await http().post('/auth/reset-password').send({ token, password: 'NewPassword1' }).expect(200);
    await http()
      .post('/auth/login')
      .send({ email: 'parent@test.tn', password: 'Password123' })
      .expect(401);
    await login('parent', 'parent@test.tn', 'NewPassword1');
  });

  it('deletes a parent account with all its data', async () => {
    await as('parent').delete('/users/me').expect(200);
    await as('parent').get('/auth/me').expect(401);
    expect((await as('teacher').get('/children').expect(200)).body).toHaveLength(0);
  });
});
