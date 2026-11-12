'use client';

import { Button, Card, Progress, Space, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import {
  MdAdd,
  MdDeleteOutline,
  MdEdit,
  MdOutlineInsights,
} from 'react-icons/md';
import { PageHeader } from '@/components/common/ui';
import { api } from '@/lib/api';
import { childName, formatDate } from '@/lib/format';
import { useApi, useNotify } from '@/lib/hooks';
import type { Quiz } from '@/types/models';

export default function TeacherQuizzesPage() {
  const { data, isLoading, mutate } = useApi<Quiz[]>('/quizzes');
  const notify = useNotify();

  const remove = (quiz: Quiz) =>
    notify.confirmDelete(
      `Delete "${quiz.title}"?`,
      async () => {
        await api.delete(`/quizzes/${quiz._id}`);
        notify.message.success('Quiz deleted');
        await mutate();
      },
      'The quiz and all the students’ answers will be deleted.'
    );

  const columns: ColumnsType<Quiz> = [
    {
      title: 'Quiz',
      dataIndex: 'title',
      render: (t, q) => (
        <>
          <div className="font-medium">{t}</div>
          <div className="text-xs text-gray-500">
            {q.questions.length} questions
          </div>
        </>
      ),
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      render: (s) => <Tag color="purple">{s}</Tag>,
    },
    {
      title: 'Students',
      key: 'children',
      render: (_, q) => (
        <span className="flex flex-wrap gap-1">
          {q.children.map((c) => (
            <Tag key={c._id} className="m-0">
              {childName(c)}
            </Tag>
          ))}
        </span>
      ),
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      render: (d) => (d ? formatDate(d) : '—'),
      responsive: ['lg'],
    },
    {
      title: 'Submissions',
      key: 'attempts',
      render: (_, q) => `${q.attemptsCount ?? 0} / ${q.children.length}`,
    },
    {
      title: 'Average',
      dataIndex: 'averagePercent',
      render: (p: number | null) =>
        p === null || p === undefined ? (
          '—'
        ) : (
          <Progress
            percent={p}
            size="small"
            className="w-28"
            strokeColor={p >= 50 ? '#16a34a' : '#f97316'}
          />
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, q) => (
        <Space>
          <Tooltip title="Results">
            <Link href={`/teacher/quizzes/${q._id}`}>
              <Button icon={<MdOutlineInsights />} />
            </Link>
          </Tooltip>
          <Tooltip title="Edit">
            <Link href={`/teacher/quizzes/${q._id}/edit`}>
              <Button icon={<MdEdit />} />
            </Link>
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              danger
              icon={<MdDeleteOutline />}
              onClick={() => remove(q)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quizzes"
        subtitle="Create quizzes for your students and follow their results."
        extra={
          <Link href="/teacher/quizzes/new">
            <Button type="primary" icon={<MdAdd />}>
              New quiz
            </Button>
          </Link>
        }
      />
      <Card styles={{ body: { padding: 0 } }}>
        <Table<Quiz>
          rowKey="_id"
          loading={isLoading}
          dataSource={data}
          columns={columns}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
}
