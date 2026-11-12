'use client';

import { Skeleton } from 'antd';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/common/ui';
import QuizForm from '@/components/quizzes/QuizForm';
import { useApi } from '@/lib/hooks';
import type { Quiz, QuizAttempt } from '@/types/models';

export default function EditQuizPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useApi<{ quiz: Quiz; attempts: QuizAttempt[] }>(
    `/quizzes/${id}/results`
  );
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Edit quiz" />
      {data ? (
        <QuizForm quiz={data.quiz} locked={data.attempts.length > 0} />
      ) : (
        <Skeleton active />
      )}
    </div>
  );
}
