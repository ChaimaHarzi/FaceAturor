'use client';

import { PageHeader } from '@/components/common/ui';
import QuizForm from '@/components/quizzes/QuizForm';

export default function NewQuizPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="New quiz"
        subtitle="Multiple-choice questions, automatically corrected."
      />
      <QuizForm />
    </div>
  );
}
