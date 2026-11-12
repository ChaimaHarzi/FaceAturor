import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Types } from 'mongoose';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { seed } from '../src/seed';

/** Seed + migration of documents created by the first version of the app. */
describe('Seed and legacy migration (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  let db: Connection['db'];

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGO_CONNECTION_STRING = mongo.getUri('faceatutor-seed');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    db = app.get<Connection>(getConnectionToken()).db;
  });

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it('migrates v1 documents and creates the super admin and demo data', async () => {
    const parentId = new Types.ObjectId();
    const teacherId = new Types.ObjectId();
    // Shapes written by the first version (string references, old field names).
    await db!.collection('users').insertOne({
      _id: parentId,
      name: 'Old parent',
      email: 'old@test.tn',
      role: 4,
      password: 'x',
      firstMeetingDate: '2024-06-04',
      accountStatus: false,
    });
    await db!
      .collection('children')
      .insertOne({ parent: String(parentId), firstName: 'A', lastName: 'B', class: '6th' });
    await db!.collection('courses').insertOne({
      teacher: String(teacherId),
      children: [String(parentId)],
      name: 'Old course',
      path: 'https://x',
    });
    await db!
      .collection('meetings')
      .insertOne({ name: 'm', parent: 'Ahmed', mentor: 'Fatma', date: '2024-05-20' });
    await db!.collection('parents').insertOne({ firstName: 'unused' });

    await seed(app, { demo: true });

    const child = await db!.collection('children').findOne({ firstName: 'A' });
    expect(child!.parent).toBeInstanceOf(Types.ObjectId);
    expect(child!.grade).toBe('6th');
    expect(child!.class).toBeUndefined();

    const course = await db!.collection('courses').findOne({ title: 'Old course' });
    expect(course!.teacher).toBeInstanceOf(Types.ObjectId);
    expect(course!.children[0]).toBeInstanceOf(Types.ObjectId);
    expect(course!.fileUrl).toBe('https://x');

    const oldParent = await db!.collection('users').findOne({ _id: parentId });
    expect(oldParent!.availableFrom).toBeInstanceOf(Date);
    expect(oldParent!.firstMeetingDate).toBeUndefined();

    expect(await db!.collection('meetings').countDocuments({ parent: 'Ahmed' })).toBe(0);
    expect(await db!.listCollections({ name: 'parents' }).toArray()).toHaveLength(0);

    // Demo accounts can sign in and see consistent data.
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'parent@demo.tn', password: 'Demo1234' })
      .expect(200);
    const children = await request(app.getHttpServer())
      .get('/children')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);
    expect(children.body).toHaveLength(2);
    expect(children.body[0].teachers.length).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'superadmin@faceatutor.tn', password: 'SuperAdmin123' })
      .expect(200);

    // Running it again is harmless.
    await expect(seed(app, { demo: true })).resolves.toBeUndefined();
  });
});
