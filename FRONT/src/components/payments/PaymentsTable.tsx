'use client';

import { Card, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { UserCell } from '@/components/common/ui';
import { childName, formatDate, formatMoney } from '@/lib/format';
import type { Payment } from '@/types/models';

const methodLabels: Record<Payment['method'], string> = {
  card: 'Card',
  transfer: 'Bank transfer',
  cash: 'Cash',
};

export default function PaymentsTable({
  data,
  loading,
  showParent,
}: {
  data?: Payment[];
  loading?: boolean;
  showParent?: boolean;
}) {
  const columns: ColumnsType<Payment> = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      render: (d) => formatDate(d),
      sorter: (a, b) => dayjs(a.createdAt).diff(b.createdAt),
      defaultSortOrder: 'descend',
    },
    ...(showParent
      ? [
          {
            title: 'Parent',
            key: 'parent',
            render: (_: unknown, p: Payment) => (
              <UserCell name={p.parent?.name} email={p.parent?.email} />
            ),
          },
        ]
      : []),
    {
      title: 'Teacher',
      key: 'teacher',
      render: (_, p) => (
        <UserCell name={p.teacher?.name} email={p.teacher?.email} />
      ),
    },
    { title: 'Child', key: 'child', render: (_, p) => childName(p.child) },
    { title: 'Formation', dataIndex: 'formation' },
    {
      title: 'Method',
      dataIndex: 'method',
      render: (m: Payment['method']) => methodLabels[m],
      responsive: ['lg'],
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      align: 'right',
      render: (a) => <span className="font-semibold">{formatMoney(a)}</span>,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s) => (
        <Tag color={s === 'paid' ? 'green' : 'red'}>
          {s === 'paid' ? 'Paid' : 'Failed'}
        </Tag>
      ),
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      render: (r) => <code className="text-xs">{r}</code>,
      responsive: ['xl'],
    },
  ];
  return (
    <Card styles={{ body: { padding: 0 } }}>
      <Table<Payment>
        rowKey="_id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: true }}
      />
    </Card>
  );
}
