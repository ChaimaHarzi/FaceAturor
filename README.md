# Faceatutor

**E-learning platform connecting parents with expert tutors, guided by a dedicated mentor.**
End-of-study project (Licence in Computer Science – ISIMA, 2024), carried out at DunDill.

A guest signs up as a parent and picks an availability range; an admin schedules a Zoom meeting
with a mentor (availability checked); after the meeting the account is activated and the mentor
matches each child with suitable teachers. Teachers then share courses, plan sessions on a shared
calendar and publish auto-corrected quizzes; parents follow progress, pay, chat and rate teachers.

| | Stack |
|---|---|
| [`BACK/`](BACK) | NestJS 10, MongoDB / Mongoose 8, Passport-JWT, class-validator, Swagger, Nodemailer, Cloudinary, Jest + Supertest + mongodb-memory-server |
| [`FRONT/`](FRONT) | Next.js 14 App Router, TypeScript strict, Ant Design 5, Tailwind CSS, NextAuth, SWR, Zustand, FullCalendar |

## Roles

Super admin · Admin · Mentor · Teacher · Parent · Student (opened from the parent account).

## Run locally

```bash
# API
cd BACK && cp .env.example .env && npm install && npm run seed:demo && npm run start:dev
# Web app (another terminal)
cd FRONT && cp .env.example .env.local && npm install && npm run dev
```

Open http://localhost:3000 and sign in with `parent@demo.tn`, `teacher@demo.tn`, `mentor@demo.tn`
or `admin@demo.tn` (password `Demo1234`). API documentation: http://localhost:8000/docs.

## Quality

- Role-based access control enforced by the API on every route (global guards) and by the web app middleware.
- 15 unit tests + 14 end-to-end tests covering the complete user journey on an in-memory database.
- Lint, strict type-checking and production builds pass for both applications.

## Authors

Chaima Harzi & Manel Monceur.
