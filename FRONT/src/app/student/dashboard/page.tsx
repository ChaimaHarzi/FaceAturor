'use client';

import {
  Button,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Skeleton,
  Table,
  Tag,
} from 'antd';
import Link from 'next/link';
import {
  MdOutlineAssignment,
  MdOutlineInsights,
  MdOutlineMenuBook,
  MdOutlineTaskAlt,
} from 'react-icons/md';
import UpcomingSessions from '@/components/calendar/UpcomingSessions';
import { PageHeader, StatCard } from '@/components/common/ui';
import { formatDate } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import { useStudentStore } from '@/lib/student-store';
import type { SessionEvent } from '@/types/models';

interface StudentStats {
  courses: number;
  quizzesAssigned: number;
  quizzesDone: number;
  quizzesPending: number;
  averageScorePercent: number | null;
  results: Array<{
    quiz: { _id: string; title: string; subject: string } | null;
    score: number;
    total: number;
    submittedAt: string;
  }>;
  upcomingSessions: SessionEvent[];
}

/** Report: "Students track their own progress" (progress dashboard). */
export default function StudentDashboard() {
  const { childId, childName } = useStudentStore();
  const { data: stats } = useApi<StudentStats>(
    childId ? `/stats?childId=${childId}` : null
  );

  if (!stats) return <Skeleton active />;
  return (
    <div>
      <PageHeader
        title={`Hi ${childName?.split(' ')[0] ?? ''}!`}
        subtitle="Here is how you are doing."
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            label="Courses"
            value={stats.courses}
            icon={<MdOutlineMenuBook />}
            color="#10b981"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            label="Quizzes to do"
            value={stats.quizzesPending}
            icon={<MdOutlineAssignment />}
            color="#f97316"
            hint={
              stats.quizzesPending ? (
                <Link href="/student/quizzes" className="text-brand">
                  Start now →
                </Link>
              ) : (
                'All done!'
              )
            }
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            label="Quizzes completed"
            value={`${stats.quizzesDone} / ${stats.quizzesAssigned}`}
            icon={<MdOutlineTaskAlt />}
            color="#4f46e5"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="h-full" styles={{ body: { padding: 20 } }}>
            <div className="flex items-center gap-4">
              <Progress
                type="circle"
                size={72}
                percent={stats.averageScorePercent ?? 0}
                format={(p) =>
                  stats.averageScorePercent === null ? '—' : `${p}%`
                }
              />
              <div>
                <div className="font-semibold">Average score</div>
                <div className="text-xs text-gray-500">
                  <MdOutlineInsights className="align-middle" /> all quizzes
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} lg={12}>
          <Card title="My latest results" styles={{ body: { padding: 0 } }}>
            {stats.results.length ? (
              <Table
                rowKey={(r) => `${r.quiz?._id}-${r.submittedAt}`}
                dataSource={stats.results}
                pagination={false}
                columns={[
                  {
                    title: 'Quiz',
                    key: 'quiz',
                    render: (_, r) => (
                      <>
                        <div className="font-medium">
                          {r.quiz?.title ?? 'Deleted quiz'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {r.quiz?.subject}
                        </div>
                      </>
                    ),
                  },
                  {
                    title: 'Score',
                    key: 'score',
                    render: (_, r) => (
                      <Tag
                        color={r.score / r.total >= 0.5 ? 'green' : 'orange'}
                      >
                        {r.score} / {r.total}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Date',
                    dataIndex: 'submittedAt',
                    render: (d) => formatDate(d),
                  },
                ]}
              />
            ) : (
              <Empty className="py-8" description="No quiz completed yet">
                <Link href="/student/quizzes">
                  <Button type="primary">See my quizzes</Button>
                </Link>
              </Empty>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <UpcomingSessions sessions={stats.upcomingSessions} show="teacher" />
        </Col>
      </Row>
    </div>
  );
}
