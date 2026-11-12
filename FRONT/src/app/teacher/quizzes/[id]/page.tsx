'use client';

import { Button, Card, Col, Progress, Row, Skeleton, Table, Tag } from 'antd';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MdEdit } from 'react-icons/md';
import { PageHeader, StatCard } from '@/components/common/ui';
import { childName, formatDate, formatDateTime } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import type { ChildRef, Quiz, QuizAttempt } from '@/types/models';

const letters = 'ABCDEF';

export default function QuizResultsPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useApi<{ quiz: Quiz; attempts: QuizAttempt[] }>(
    `/quizzes/${id}/results`
  );
  if (!data) return <Skeleton active />;
  const { quiz, attempts } = data;

  const average = attempts.length
    ? Math.round(
        (attempts.reduce((s, a) => s + a.score / a.total, 0) /
          attempts.length) *
          100
      )
    : null;
  const answered = new Set(attempts.map((a) => a.child?._id));
  const missing = quiz.children.filter((c: ChildRef) => !answered.has(c._id));

  // Success rate of each question, to spot what needs to be explained again.
  const perQuestion = quiz.questions.map((q, i) => {
    const correct = attempts.filter(
      (a) => a.answers[i] === q.correctIndex
    ).length;
    return attempts.length
      ? Math.round((correct / attempts.length) * 100)
      : null;
  });

  return (
    <div>
      <PageHeader
        title={quiz.title}
        subtitle={`${quiz.subject} · ${quiz.questions.length} questions${quiz.deadline ? ` · deadline ${formatDate(quiz.deadline)}` : ''}`}
        extra={
          <Link href={`/teacher/quizzes/${quiz._id}/edit`}>
            <Button icon={<MdEdit />}>Edit</Button>
          </Link>
        }
      />
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} md={8}>
          <StatCard
            label="Submissions"
            value={`${attempts.length} / ${quiz.children.length}`}
          />
        </Col>
        <Col xs={24} md={8}>
          <StatCard
            label="Average score"
            value={average !== null ? `${average}%` : '—'}
          />
        </Col>
        <Col xs={24} md={8}>
          <StatCard
            label="Not submitted yet"
            value={missing.length}
            hint={missing.map(childName).join(', ')}
          />
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Results by student" styles={{ body: { padding: 0 } }}>
            <Table<QuizAttempt>
              rowKey="_id"
              dataSource={attempts}
              pagination={false}
              columns={[
                {
                  title: 'Student',
                  key: 'child',
                  render: (_, a) => childName(a.child),
                },
                {
                  title: 'Score',
                  key: 'score',
                  render: (_, a) => (
                    <Tag color={a.score / a.total >= 0.5 ? 'green' : 'orange'}>
                      {a.score} / {a.total}
                    </Tag>
                  ),
                },
                {
                  title: 'Submitted',
                  dataIndex: 'createdAt',
                  render: (d) => formatDateTime(d),
                },
              ]}
              locale={{ emptyText: 'No submission yet' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Success rate by question">
            <div className="space-y-4">
              {quiz.questions.map((q, i) => (
                <div key={i}>
                  <div className="text-sm font-medium">
                    {i + 1}. {q.text}
                  </div>
                  <div className="text-xs text-gray-500">
                    Answer: {letters[q.correctIndex ?? 0]}.{' '}
                    {q.choices[q.correctIndex ?? 0]}
                  </div>
                  {perQuestion[i] !== null ? (
                    <Progress percent={perQuestion[i] ?? 0} size="small" />
                  ) : (
                    <div className="text-xs text-gray-400">No answer yet</div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
