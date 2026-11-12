'use client';

import { Col, Row, Skeleton } from 'antd';
import {
  MdOutlineChildCare,
  MdOutlineFamilyRestroom,
  MdOutlineInsights,
  MdOutlineMenuBook,
  MdOutlinePayments,
  MdOutlineQuiz,
  MdOutlineStarOutline,
} from 'react-icons/md';
import UpcomingSessions from '@/components/calendar/UpcomingSessions';
import { PageHeader, StatCard } from '@/components/common/ui';
import { formatMoney } from '@/lib/format';
import { useApi, useCurrentUser } from '@/lib/hooks';
import type { Rating, SessionEvent } from '@/types/models';

interface TeacherStats {
  students: number;
  parents: number;
  courses: number;
  quizzes: number;
  attempts: number;
  averageScorePercent: number | null;
  rating: Rating;
  earnings: number;
  upcomingSessions: SessionEvent[];
}

export default function TeacherDashboard() {
  const user = useCurrentUser();
  const { data: stats } = useApi<TeacherStats>('/stats');

  if (!stats) return <Skeleton active />;
  return (
    <div>
      <PageHeader
        title={`Hello ${user?.name ?? ''}`}
        subtitle="Your students, content and results at a glance."
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            label="Students"
            value={stats.students}
            icon={<MdOutlineChildCare />}
            color="#ec4899"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            label="Families"
            value={stats.parents}
            icon={<MdOutlineFamilyRestroom />}
            color="#f59e0b"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            label="Courses published"
            value={stats.courses}
            icon={<MdOutlineMenuBook />}
            color="#10b981"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            label="Quizzes"
            value={stats.quizzes}
            icon={<MdOutlineQuiz />}
            color="#8b5cf6"
            hint={`${stats.attempts} submissions`}
          />
        </Col>
        <Col xs={24} sm={12} xl={8}>
          <StatCard
            label="Average quiz score"
            value={
              stats.averageScorePercent !== null
                ? `${stats.averageScorePercent}%`
                : '—'
            }
            icon={<MdOutlineInsights />}
            color="#0891b2"
          />
        </Col>
        <Col xs={24} sm={12} xl={8}>
          <StatCard
            label="Parents’ rating"
            value={
              stats.rating.average !== null ? `${stats.rating.average}/5` : '—'
            }
            icon={<MdOutlineStarOutline />}
            color="#f97316"
            hint={`${stats.rating.count} evaluation(s)`}
          />
        </Col>
        <Col xs={24} sm={12} xl={8}>
          <StatCard
            label="Earnings"
            value={formatMoney(stats.earnings)}
            icon={<MdOutlinePayments />}
            color="#16a34a"
          />
        </Col>
      </Row>
      <div className="mt-4">
        <UpcomingSessions sessions={stats.upcomingSessions} />
      </div>
    </div>
  );
}
