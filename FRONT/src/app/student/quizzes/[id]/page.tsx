'use client';

import {
  Alert,
  Button,
  Card,
  Progress,
  Radio,
  Result,
  Skeleton,
  Space,
} from 'antd';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { MdCheckCircle, MdCancel } from 'react-icons/md';
import { PageHeader } from '@/components/common/ui';
import { api } from '@/lib/api';
import { useApi, useNotify } from '@/lib/hooks';
import { useStudentStore } from '@/lib/student-store';
import type { Quiz } from '@/types/models';

const letters = 'ABCDEF';

/** Report sprint 5 "Take quizzes": immediate, server-side correction. */
export default function TakeQuizPage() {
  const { id } = useParams<{ id: string }>();
  const childId = useStudentStore((s) => s.childId);
  const notify = useNotify();
  const { data: quiz, mutate } = useApi<Quiz>(
    childId ? `/quizzes/${id}?childId=${childId}` : null
  );
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!quiz) return <Skeleton active />;
  const done = !!quiz.attempt;
  const answeredCount = Object.keys(answers).length;

  const submit = () =>
    notify.modal.confirm({
      title: 'Submit your answers?',
      content: 'You will not be able to change them afterwards.',
      okText: 'Submit',
      onOk: async () => {
        setSubmitting(true);
        try {
          const ordered = quiz.questions.map((_, i) => answers[i]);
          const { data } = await api.post<Quiz>(`/quizzes/${id}/submit`, {
            childId,
            answers: ordered,
          });
          await mutate(data, false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
          notify.error(e);
        } finally {
          setSubmitting(false);
        }
      },
    });

  const percent = quiz.attempt
    ? Math.round((quiz.attempt.score / quiz.attempt.total) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={quiz.title}
        subtitle={`${quiz.subject} · ${quiz.questions.length} questions`}
      />
      {quiz.description && (
        <Alert className="mb-4" type="info" message={quiz.description} />
      )}

      {quiz.attempt && (
        <Card className="mb-4">
          <Result
            className="py-2"
            icon={
              <Progress
                type="circle"
                percent={percent}
                strokeColor={percent >= 50 ? '#16a34a' : '#f97316'}
              />
            }
            title={`${quiz.attempt.score} / ${quiz.attempt.total}`}
            subTitle={
              percent >= 80
                ? 'Excellent work!'
                : percent >= 50
                  ? 'Well done, keep practising!'
                  : 'Keep going, review the corrections below.'
            }
            extra={
              <Link href="/student/quizzes">
                <Button>Back to my quizzes</Button>
              </Link>
            }
          />
        </Card>
      )}

      <Space direction="vertical" size="middle" className="w-full">
        {quiz.questions.map((q, i) => (
          <Card key={i} size="small" title={`${i + 1}. ${q.text}`}>
            <Radio.Group
              value={done ? q.answer : answers[i]}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
              }
              disabled={done}
              className="w-full"
            >
              <Space direction="vertical" className="w-full">
                {q.choices.map((choice, ci) => {
                  const correct = done && q.correctIndex === ci;
                  const wrong =
                    done && q.answer === ci && q.correctIndex !== ci;
                  return (
                    <Radio
                      key={ci}
                      value={ci}
                      className={`w-full rounded-lg px-3 py-2 ${correct ? 'bg-green-50' : wrong ? 'bg-red-50' : ''}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <b>{letters[ci]}.</b> {choice}
                        {correct && (
                          <MdCheckCircle className="text-green-600" />
                        )}
                        {wrong && <MdCancel className="text-red-500" />}
                      </span>
                    </Radio>
                  );
                })}
              </Space>
            </Radio.Group>
          </Card>
        ))}
      </Space>

      {!done && (
        <div className="sticky bottom-0 mt-4 flex items-center justify-between rounded-xl bg-white p-4 shadow-lg">
          <span className="text-gray-500">
            {answeredCount} / {quiz.questions.length} answered
          </span>
          <Button
            type="primary"
            size="large"
            disabled={answeredCount < quiz.questions.length}
            loading={submitting}
            onClick={submit}
          >
            Submit
          </Button>
        </div>
      )}
    </div>
  );
}
