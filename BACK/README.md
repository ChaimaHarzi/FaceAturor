# Faceatutor API

REST API of **Faceatutor**, an e-learning platform that connects parents with expert tutors,
guided by a mentor. Built with **NestJS 10, MongoDB (Mongoose 8), Passport-JWT and Swagger**.

## Features

| Domain | Endpoints | Rules |
|---|---|---|
| Authentication | `/auth/register`, `/auth/verify-email`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/password` | Sign-up always creates a **pending parent**; email verification and reset links use single-use hashed tokens (reset valid 1 h) |
| Users | `/users`, `/users/me`, `/users/:id/activate`, `/users/:id/mentor` | Super admin manages admins, admins manage mentors/teachers/parents; everyone else only sees the people they work with |
| Children (students) | `/children`, `/children/:id/teachers` | Parents manage profiles, the mentor assigns teachers |
| Meetings | `/meetings`, `/meetings/availability` | Admin schedules parent–mentor Zoom meetings, **mentor availability is checked** (no overlap), emails sent |
| Messages | `/messages/contacts`, `/messages/with/:id`, `/messages` | One-to-one chat restricted by role relations, unread counters, read receipts |
| Courses | `/courses` | Teachers share files (Cloudinary) or links with **their own** students only |
| Calendar | `/events` | Teacher sessions shown on the student calendar |
| Quizzes | `/quizzes`, `/quizzes/:id/submit`, `/quizzes/:id/results` | Correction is computed **server-side**, answers hidden until submission, one attempt |
| Payments | `/payments` | Enrolment of a child with one of their teachers, receipt by email (payment gateway simulated) |
| Feedback & ratings | `/feedback`, `/ratings` | Platform feedback, one editable rating per parent and teacher |
| Dashboards | `/stats`, `/public/teachers`, `/public/stats` | KPIs per role, student progress, public data for the home page |

Interactive documentation: **http://localhost:8000/docs** (Swagger, with JWT authorisation).

## Architecture

```
src/
├── common/        enums, decorators (@Public, @Roles, @AllowInactive, @CurrentUser), guards, pipes, filters
├── database/      global module registering every model + AccessService (who can see what)
├── auth/          JWT strategy, register / login / email verification / password reset
├── users/ children/ meetings/ messages/ courses/ events/ quizzes/ payments/ reviews/ stats/
├── mail/          Nodemailer (falls back to console output in development)
└── seed.ts        super admin, legacy data migration, optional demo dataset
```

- **Secure by default**: global `JwtAuthGuard` + `RolesGuard`; routes are private unless marked `@Public()`.
- Pending accounts are blocked everywhere except `@AllowInactive()` routes.
- `ValidationPipe({ whitelist: true })` + class-validator DTOs: unknown fields are stripped (no mass assignment).
- Passwords hashed with bcrypt and never serialised; Mongo errors mapped to 400/409.

## Getting started

```bash
cp .env.example .env      # then fill MONGO_CONNECTION_STRING and JWT_SECRET
npm install
npm run seed:demo         # super admin + demo accounts (password: Demo1234)
npm run start:dev         # http://localhost:8000
```

Demo accounts: `admin@demo.tn`, `mentor@demo.tn`, `teacher@demo.tn`, `parent@demo.tn`, `pending@demo.tn`.

`npm run seed` also migrates data created by the first version (string references → ObjectId,
renamed fields) and removes documents that cannot be migrated.

## Tests

```bash
npm test          # unit tests (auth service, guards, quiz scoring)
npm run test:e2e  # full scenario on an in-memory MongoDB (no external service needed)
```

The end-to-end suite follows the whole journey of the report: sign-up → email verification →
first meeting (availability check) → activation → child profile → teacher assignment → courses,
calendar, quizzes → messages → payments, ratings, feedback → password reset → account deletion,
and checks the access rules at every step.
