'use client';

import { Button, Card, Col, Empty, Row, Skeleton, Tag } from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import { PageHeader } from '@/components/common/ui';
import { formatDate } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import { useStudentStore } from '@/lib/student-store';
import type { Quiz } from '@/types/models';

export default function StudentQuizzesPage() {
  const childId = useStudentStore((s) => s.childId);
  const { data, isLoading } = useApi<Quiz[]>(
    childId ? `/quizzes?childId=${childId}` : null
  );

  return (
    <div>
      <PageHeader
        title="My quizzes"
        subtitle="Test yourself on what you learned."
      />
      {isLoading && <Skeleton active />}
      {data && !data.length && (
        <Card>
          <Empty description="No quiz yet" />
        </Card>
      )}
      <Row gutter={[16, 16]}>
        {data?.map((quiz) => {
          const expired =
            !quiz.attempt &&
            quiz.deadline &&
            dayjs(quiz.deadline).isBefore(dayjs());
          return (
            <Col key={quiz._id} xs={24} md={12} xl={8}>
              <Card className="h-full">
                <div className="flex items-center justify-between">
                  <Tag color="purple">{quiz.subject}</Tag>
                  {quiz.attempt ? (
                    <Tag
                      color={
                        quiz.attempt.score / quiz.attempt.total >= 0.5
                          ? 'green'
                          : 'orange'
                      }
                    >
                      {quiz.attempt.score} / {quiz.attempt.total}
                    </Tag>
                  ) : expired ? (
                    <Tag color="red">Expired</Tag>
                  ) : (
                    <Tag color="gold">To do</Tag>
                  )}
                </div>
                <h3 className="mt-2 text-lg font-semibold">{quiz.title}</h3>
                <p className="text-sm text-gray-500">
                  {quiz.questionsCount} questions · by {quiz.teacher?.name}
                  {quiz.deadline && ` · before ${formatDate(quiz.deadline)}`}
                </p>
                <Link href={`/student/quizzes/${quiz._id}`}>
                  <Button
                    type={quiz.attempt ? 'default' : 'primary'}
                    block
                    className="mt-3"
                    disabled={!!expired}
                  >
                    {quiz.attempt ? 'See correction' : 'Start the quiz'}
                  </Button>
                </Link>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
