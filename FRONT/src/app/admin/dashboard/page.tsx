'use client';

import { Alert, Button, Card, Col, Row, Skeleton } from 'antd';
import Link from 'next/link';
import {
  MdOutlineChildCare,
  MdOutlineFamilyRestroom,
  MdOutlineFeedback,
  MdOutlineHourglassTop,
  MdOutlineMenuBook,
  MdOutlinePayments,
  MdOutlineQuiz,
  MdOutlineSchool,
  MdOutlineSupportAgent,
  MdOutlineVideoCall,
} from 'react-icons/md';
import BarChart from '@/components/common/BarChart';
import { PageHeader, StatCard } from '@/components/common/ui';
import { formatMoney } from '@/lib/format';
import { useApi, useCurrentUser } from '@/lib/hooks';
import type { MonthlyValue } from '@/types/models';

interface AdminStats {
  users: {
    parents: number;
    pending: number;
    teachers: number;
    mentors: number;
    admins: number;
  };
  children: number;
  courses: number;
  quizzes: number;
  upcomingMeetings: number;
  payments: { total: number; count: number };
  feedback: { average: number | null; count: number };
  paymentsByMonth: MonthlyValue[];
  signupsByMonth: MonthlyValue[];
}

export default function AdminDashboard() {
  const user = useCurrentUser();
  const { data: stats } = useApi<AdminStats>('/stats');

  return (
    <div>
      <PageHeader
        title={`Hello ${user?.name ?? ''}`}
        subtitle="Overview of the platform activity."
      />
      {!stats ? (
        <Skeleton active />
      ) : (
        <>
          {stats.users.pending > 0 && (
            <Alert
              className="mb-5"
              type="warning"
              showIcon
              message={`${stats.users.pending} parent account(s) waiting for a first meeting`}
              action={
                <Link href="/admin/pending-accounts">
                  <Button size="small">Review</Button>
                </Link>
              }
            />
          )}
          <Row gutter={[16, 16]}>
            {[
              {
                label: 'Active parents',
                value: stats.users.parents,
                icon: <MdOutlineFamilyRestroom />,
                color: '#f59e0b',
              },
              {
                label: 'Pending accounts',
                value: stats.users.pending,
                icon: <MdOutlineHourglassTop />,
                color: '#ef4444',
              },
              {
                label: 'Teachers',
                value: stats.users.teachers,
                icon: <MdOutlineSchool />,
                color: '#4f46e5',
              },
              {
                label: 'Mentors',
                value: stats.users.mentors,
                icon: <MdOutlineSupportAgent />,
                color: '#0891b2',
              },
              {
                label: 'Students',
                value: stats.children,
                icon: <MdOutlineChildCare />,
                color: '#ec4899',
              },
              {
                label: 'Courses',
                value: stats.courses,
                icon: <MdOutlineMenuBook />,
                color: '#10b981',
              },
              {
                label: 'Quizzes',
                value: stats.quizzes,
                icon: <MdOutlineQuiz />,
                color: '#8b5cf6',
              },
              {
                label: 'Upcoming meetings',
                value: stats.upcomingMeetings,
                icon: <MdOutlineVideoCall />,
                color: '#0ea5e9',
              },
              {
                label: 'Revenue',
                value: formatMoney(stats.payments.total),
                icon: <MdOutlinePayments />,
                color: '#16a34a',
                hint: `${stats.payments.count} payments`,
              },
              {
                label: 'Parent satisfaction',
                value:
                  stats.feedback.average !== null
                    ? `${stats.feedback.average}/5`
                    : '—',
                icon: <MdOutlineFeedback />,
                color: '#f97316',
                hint: `${stats.feedback.count} feedback`,
              },
            ].map((card) => (
              <Col key={card.label} xs={24} sm={12} lg={8} xl={6}>
                <StatCard {...card} />
              </Col>
            ))}
          </Row>
          <Row gutter={[16, 16]} className="mt-4">
            <Col xs={24} lg={12}>
              <Card title="Revenue (last 6 months)">
                <BarChart
                  data={stats.paymentsByMonth}
                  format={formatMoney}
                  color="#16a34a"
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="New parent sign-ups">
                <BarChart data={stats.signupsByMonth} color="#ec4899" />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
