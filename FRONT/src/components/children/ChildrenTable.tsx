'use client';

import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ReactNode } from 'react';
import { UserCell } from '@/components/common/ui';
import { ageFrom, childName } from '@/lib/format';
import type { Child, UserRef } from '@/types/models';

interface Props {
  data?: Child[];
  loading?: boolean;
  showParent?: boolean;
  actions?: (child: Child) => ReactNode;
  emptyText?: string;
}

export default function ChildrenTable({
  data,
  loading,
  showParent,
  actions,
  emptyText,
}: Props) {
  const columns: ColumnsType<Child> = [
    {
      title: 'Student',
      key: 'name',
      render: (_, c) => <span className="font-medium">{childName(c)}</span>,
    },
    { title: 'Grade', dataIndex: 'grade' },
    {
      title: 'Age',
      dataIndex: 'dateOfBirth',
      render: (d) => ageFrom(d),
      responsive: ['md'],
    },
    ...(showParent
      ? [
          {
            title: 'Parent',
            key: 'parent',
            render: (_: unknown, c: Child) => {
              const parent = c.parent as UserRef;
              return <UserCell name={parent?.name} email={parent?.email} />;
            },
          },
        ]
      : []),
    {
      title: 'Teachers',
      key: 'teachers',
      render: (_, c) =>
        c.teachers.length ? (
          <span className="flex flex-wrap gap-1">
            {c.teachers.map((t) => (
              <Tag key={t._id} color="blue" className="m-0">
                {t.name}
              </Tag>
            ))}
          </span>
        ) : (
          <Tag color="orange">No teacher yet</Tag>
        ),
    },
    {
      title: 'Special needs',
      dataIndex: 'specialNeeds',
      render: (v) => v || <span className="text-gray-400">—</span>,
      responsive: ['lg'],
    },
  ];
  if (actions)
    columns.push({
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, c) => actions(c),
    });

  return (
    <Table<Child>
      rowKey="_id"
      loading={loading}
      dataSource={data}
      columns={columns}
      pagination={{ pageSize: 10, hideOnSinglePage: true }}
      locale={emptyText ? { emptyText } : undefined}
      scroll={{ x: true }}
    />
  );
}
