'use client';

import { Button, Card, Rate, Space, Table, Tabs, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { MdStarOutline } from 'react-icons/md';
import {
  PageHeader,
  RatingDisplay,
  TagList,
  UserCell,
} from '@/components/common/ui';
import RateTeacherModal from '@/components/users/RateTeacherModal';
import { MessageButton } from '@/components/users/UsersDirectory';
import { childName } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import type { Child, TeacherRating, User, UserRef } from '@/types/models';

interface Row {
  teacher: UserRef;
  children: string[];
}

export default function ParentTeachersPage() {
  const { data: children, isLoading } = useApi<Child[]>('/children');
  const {
    data: allTeachers,
    isLoading: loadingAll,
    mutate: refreshTeachers,
  } = useApi<User[]>('/users?role=teacher');
  const { data: myRatings, mutate: refreshRatings } =
    useApi<TeacherRating[]>('/ratings/mine');
  const [rating, setRating] = useState<UserRef | null>(null);

  // Teachers of my children (report fig. 4.7), with the children they follow.
  const rows = useMemo(() => {
    const map = new Map<string, Row>();
    children?.forEach((child) =>
      child.teachers.forEach((t) => {
        const row = map.get(t._id) ?? { teacher: t, children: [] };
        row.children.push(childName(child));
        map.set(t._id, row);
      })
    );
    return Array.from(map.values());
  }, [children]);

  const ratingOf = (teacherId: string) =>
    myRatings?.find((r) => r.teacher === teacherId);

  const columns: ColumnsType<Row> = [
    {
      title: 'Teacher',
      key: 'teacher',
      render: (_, r) => (
        <UserCell name={r.teacher.name} email={r.teacher.email} />
      ),
    },
    {
      title: 'Expertise',
      key: 'expertise',
      render: (_, r) => <TagList items={r.teacher.expertise} color="blue" />,
      responsive: ['md'],
    },
    {
      title: 'Children',
      key: 'children',
      render: (_, r) => (
        <span className="flex flex-wrap gap-1">
          {r.children.map((c) => (
            <Tag key={c} className="m-0">
              {c}
            </Tag>
          ))}
        </span>
      ),
    },
    {
      title: 'My evaluation',
      key: 'rating',
      render: (_, r) => {
        const mine = ratingOf(r.teacher._id);
        return mine ? (
          <Rate disabled value={mine.score} style={{ fontSize: 13 }} />
        ) : (
          <span className="text-xs text-gray-400">Not rated</span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, r) => (
        <Space>
          <MessageButton userId={r.teacher._id} label="Message" />
          <Button
            type="primary"
            icon={<MdStarOutline />}
            onClick={() => setRating(r.teacher)}
          >
            {ratingOf(r.teacher._id) ? 'Edit rating' : 'Rate'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Teachers"
        subtitle="The teachers of your children, and all the tutors of the platform."
      />
      <Tabs
        items={[
          {
            key: 'mine',
            label: 'My children’s teachers',
            children: (
              <Card styles={{ body: { padding: 0 } }}>
                <Table<Row>
                  rowKey={(r) => r.teacher._id}
                  loading={isLoading}
                  dataSource={rows}
                  columns={columns}
                  pagination={false}
                  scroll={{ x: true }}
                  locale={{
                    emptyText: 'Your mentor has not assigned teachers yet',
                  }}
                />
              </Card>
            ),
          },
          {
            key: 'all',
            label: 'All teachers',
            children: (
              <Card styles={{ body: { padding: 0 } }}>
                <Table<User>
                  rowKey="_id"
                  loading={loadingAll}
                  dataSource={allTeachers}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  scroll={{ x: true }}
                  columns={[
                    {
                      title: 'Teacher',
                      key: 'teacher',
                      render: (_, t) => <UserCell name={t.name} />,
                    },
                    {
                      title: 'Expertise',
                      dataIndex: 'expertise',
                      render: (e) => <TagList items={e} color="blue" />,
                    },
                    {
                      title: 'Qualifications',
                      dataIndex: 'qualifications',
                      render: (q) => <TagList items={q} />,
                      responsive: ['lg'],
                    },
                    {
                      title: 'Rating',
                      dataIndex: 'rating',
                      render: (r) => <RatingDisplay rating={r} />,
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />
      <RateTeacherModal
        teacher={rating}
        current={rating ? ratingOf(rating._id) : undefined}
        onClose={() => setRating(null)}
        onSaved={() => {
          refreshRatings();
          refreshTeachers();
        }}
      />
    </div>
  );
}
