'use client';

import { Button, Card, Rate, Skeleton } from 'antd';
import Link from 'next/link';
import {
  MdOutlineCalendarMonth,
  MdOutlineInsights,
  MdOutlineQuiz,
  MdOutlineSupportAgent,
  MdOutlineVerifiedUser,
  MdOutlineVideoCall,
} from 'react-icons/md';
import { RatingDisplay, TagList, UserAvatar } from '@/components/common/ui';
import { useApi } from '@/lib/hooks';
import type { PublicTeacher } from '@/types/models';

interface PublicStats {
  teachers: number;
  mentors: number;
  students: number;
  courses: number;
  testimonials: Array<{ name: string; rating: number; comment: string }>;
}

const features = [
  {
    icon: MdOutlineSupportAgent,
    title: 'A dedicated mentor',
    text: 'A mentor meets you, understands your child’s needs and picks the right teachers.',
  },
  {
    icon: MdOutlineVerifiedUser,
    title: 'Expert teachers',
    text: 'Qualified tutors upload quality courses and follow each student personally.',
  },
  {
    icon: MdOutlineInsights,
    title: 'Progress you can see',
    text: 'Quizzes, scores and a progress dashboard keep parents informed at all times.',
  },
  {
    icon: MdOutlineCalendarMonth,
    title: 'One shared calendar',
    text: 'Sessions planned by teachers appear instantly on your child’s calendar.',
  },
  {
    icon: MdOutlineQuiz,
    title: 'Interactive quizzes',
    text: 'Automatically corrected quizzes keep children motivated and measure progress.',
  },
  {
    icon: MdOutlineVideoCall,
    title: 'Live online sessions',
    text: 'Join Zoom sessions and meetings directly from the platform.',
  },
];

const steps = [
  {
    title: 'Sign up',
    text: 'Create a parent account and choose when you are available for a first meeting.',
  },
  {
    title: 'Meet your mentor',
    text: 'An admin schedules a video call with a mentor who learns about your child.',
  },
  {
    title: 'Get matched',
    text: 'Your account is activated and the mentor assigns the most suitable teachers.',
  },
  {
    title: 'Learn & follow',
    text: 'Courses, sessions, quizzes, messages and payments — all in one place.',
  },
];

export default function HomePage() {
  const { data: teachers, isLoading } =
    useApi<PublicTeacher[]>('/public/teachers');
  const { data: stats } = useApi<PublicStats>('/public/stats');

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-[url('/bgHeero.jpg')] bg-cover bg-center">
        <div className="bg-gradient-to-r from-navy/95 via-navy/80 to-navy/40">
          <div className="mx-auto max-w-6xl px-4 py-24 md:py-32">
            <h1 className="max-w-2xl text-4xl font-bold leading-tight text-white md:text-5xl">
              Find the perfect tutor for your child
            </h1>
            <p className="mt-5 max-w-xl text-lg text-gray-200">
              Discover a world of personalised learning with expert tutors,
              guided by a mentor who cares about your child’s journey.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register">
                <Button type="primary" size="large">
                  Get started
                </Button>
              </Link>
              <Link href="/#teachers">
                <Button size="large" ghost>
                  Meet our teachers
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key figures */}
      <section className="relative z-10 mx-auto -mt-10 max-w-5xl px-4">
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-5 shadow-lg md:grid-cols-4">
          {[
            { label: 'Expert teachers', value: stats?.teachers },
            { label: 'Mentors', value: stats?.mentors },
            { label: 'Students', value: stats?.students },
            { label: 'Courses shared', value: stats?.courses },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-3xl font-bold text-brand">
                {item.value ?? '–'}
              </div>
              <div className="text-sm text-gray-500">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-semibold text-navy">
          Why parents choose Faceatutor
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="h-full">
              <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-2xl text-brand">
                <Icon />
              </span>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-gray-500">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 bg-brand-light py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-semibold text-navy">
            How it works
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teachers */}
      <section
        id="teachers"
        className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16"
      >
        <h2 className="text-center text-3xl font-semibold text-navy">
          Our teachers
        </h2>
        <p className="mt-2 text-center text-gray-500">
          Qualified tutors, rated by the parents.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 3 }, (_, i) => (
              <Card key={i}>
                <Skeleton avatar active />
              </Card>
            ))}
          {teachers?.map((teacher) => (
            <Card key={teacher.id} className="h-full">
              <div className="flex items-center gap-3">
                <UserAvatar name={teacher.name} size={48} />
                <div>
                  <div className="font-semibold">{teacher.name}</div>
                  <RatingDisplay rating={teacher.rating} />
                </div>
              </div>
              {teacher.bio && (
                <p className="mt-3 text-sm text-gray-600">{teacher.bio}</p>
              )}
              <div className="mt-3">
                <TagList items={teacher.expertise} color="blue" />
              </div>
            </Card>
          ))}
          {teachers && !teachers.length && (
            <p className="col-span-full text-center text-gray-400">
              Our teachers will be listed here soon.
            </p>
          )}
        </div>
      </section>

      {/* Testimonials */}
      {!!stats?.testimonials.length && (
        <section id="testimonials" className="scroll-mt-20 bg-gray-50 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-semibold text-navy">
              What parents say
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {stats.testimonials.map((t, i) => (
                <Card key={i} className="h-full">
                  <Rate disabled value={t.rating} style={{ fontSize: 14 }} />
                  <p className="mt-3 text-gray-700">“{t.comment}”</p>
                  <div className="mt-4 font-semibold">{t.name}</div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call to action */}
      <section className="mx-auto max-w-4xl px-4 pt-16 text-center">
        <h2 className="text-3xl font-semibold text-navy">
          Ready to give your child the right support?
        </h2>
        <p className="mt-3 text-gray-500">
          Sign up in two minutes, a mentor will contact you.
        </p>
        <Link href="/register">
          <Button type="primary" size="large" className="mt-6">
            Create my parent account
          </Button>
        </Link>
      </section>
    </div>
  );
}
