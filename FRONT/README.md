# Faceatutor – Web app

Frontend of **Faceatutor**, built with **Next.js 14 (App Router), TypeScript (strict), Ant Design 5,
Tailwind CSS, NextAuth, SWR, Zustand and FullCalendar**.

## Spaces

| Space | Pages |
|---|---|
| Public | Home (real teachers, ratings and testimonials from the API), sign in, sign up with availability range, email verification, forgot / reset password |
| Admin & Super admin | Dashboard with KPIs and monthly charts, meetings (live mentor availability check), pending accounts (schedule → activate with a mentor), admins (super admin only), mentors, teachers (ratings), parents (children & teachers), add user, payments, feedback, messages |
| Mentor | Dashboard, meetings calendar, my families (assign teachers to each child), teachers, admins, messages |
| Teacher | Dashboard, calendar (create/edit sessions by selecting a slot), courses (file or link), quiz builder and results per student and per question, my students, mentors, messages |
| Parent | Children profiles, teachers (message & rate), my mentor, payments, messages, feedback |
| Student | Opened by the parent: progress dashboard, calendar, courses, quizzes with instant correction |

- `middleware.ts` protects every space by role and keeps pending parents on `/pending`.
- The NextAuth session is refreshed from the API (`/auth/me`), never from client data.
- One shared design system: `AppShell` (collapsible sidebar, unread messages badge),
  reusable directory, calendar, chat, profile and form components.

## Getting started

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL, NEXTAUTH_URL, NEXTAUTH_SECRET
npm install
npm run dev                  # http://localhost:3000 (the API must run on NEXT_PUBLIC_API_URL)
```

```bash
npm run lint && npm run build
```
