'use client';

import { Button, Card, Space, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { MdAdd, MdDeleteOutline, MdEdit } from 'react-icons/md';
import { PageHeader } from '@/components/common/ui';
import CourseFormModal from '@/components/courses/CourseFormModal';
import CourseLinks from '@/components/courses/CourseLink';
import { api } from '@/lib/api';
import { childName, formatDate } from '@/lib/format';
import { useApi, useNotify } from '@/lib/hooks';
import type { Course } from '@/types/models';

export default function TeacherCoursesPage() {
  const { data, isLoading, mutate } = useApi<Course[]>('/courses');
  const notify = useNotify();
  const [modal, setModal] = useState<{ course?: Course } | null>(null);

  const remove = (course: Course) =>
    notify.confirmDelete(`Delete "${course.title}"?`, async () => {
      await api.delete(`/courses/${course._id}`);
      notify.message.success('Course deleted');
      await mutate();
    });

  const columns: ColumnsType<Course> = [
    {
      title: 'Course',
      dataIndex: 'title',
      render: (t, c) => (
        <>
          <div className="font-medium">{t}</div>
          {c.description && (
            <div className="max-w-xs truncate text-xs text-gray-500">
              {c.description}
            </div>
          )}
        </>
      ),
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      render: (s) => <Tag color="blue">{s}</Tag>,
    },
    {
      title: 'Content',
      key: 'content',
      render: (_, c) => <CourseLinks course={c} />,
    },
    {
      title: 'Students',
      key: 'children',
      render: (_, c) =>
        c.children.length ? (
          <span className="flex flex-wrap gap-1">
            {c.children.map((ch) => (
              <Tag key={ch._id} className="m-0">
                {childName(ch)}
              </Tag>
            ))}
          </span>
        ) : (
          <Tag color="orange">Not shared</Tag>
        ),
    },
    {
      title: 'Published',
      dataIndex: 'createdAt',
      render: (d) => formatDate(d),
      responsive: ['lg'],
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, c) => (
        <Space>
          <Tooltip title="Edit">
            <Button icon={<MdEdit />} onClick={() => setModal({ course: c })} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              danger
              icon={<MdDeleteOutline />}
              onClick={() => remove(c)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="My courses"
        subtitle="Share documents and resources with your students."
        extra={
          <Button type="primary" icon={<MdAdd />} onClick={() => setModal({})}>
            New course
          </Button>
        }
      />
      <Card styles={{ body: { padding: 0 } }}>
        <Table<Course>
          rowKey="_id"
          loading={isLoading}
          dataSource={data}
          columns={columns}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: true }}
        />
      </Card>
      <CourseFormModal
        open={!!modal}
        course={modal?.course}
        onClose={() => setModal(null)}
        onSaved={() => mutate()}
      />
    </div>
  );
}
