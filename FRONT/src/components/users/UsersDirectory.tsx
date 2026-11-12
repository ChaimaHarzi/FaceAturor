'use client';

import { Button, Card, Input, Space, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import { type ReactNode, useMemo, useState } from 'react';
import { MdDeleteOutline, MdOutlineMessage, MdSearch } from 'react-icons/md';
import { GenderTag, PageHeader, UserCell } from '@/components/common/ui';
import { api } from '@/lib/api';
import { useApi, useCurrentUser, useNotify } from '@/lib/hooks';
import { messagesHref } from '@/lib/navigation';
import type { User } from '@/types/models';

interface Props {
  title: string;
  subtitle?: string;
  /** Query string for GET /users, e.g. "role=teacher". */
  query: string;
  extraColumns?: ColumnsType<User>;
  /** Extra buttons per row. */
  actions?: (user: User, refresh: () => void) => ReactNode;
  canMessage?: boolean;
  canDelete?: boolean;
  headerExtra?: ReactNode;
  emptyText?: string;
}

export function MessageButton({
  userId,
  label,
}: {
  userId: string;
  label?: string;
}) {
  const me = useCurrentUser();
  if (!me) return null;
  return (
    <Tooltip title={label ? undefined : 'Send a message'}>
      <Link href={`${messagesHref(me.role)}?with=${userId}`}>
        <Button icon={<MdOutlineMessage />}>{label}</Button>
      </Link>
    </Tooltip>
  );
}

export default function UsersDirectory({
  title,
  subtitle,
  query,
  extraColumns = [],
  actions,
  canMessage,
  canDelete,
  headerExtra,
  emptyText,
}: Props) {
  const { data, isLoading, mutate } = useApi<User[]>(`/users?${query}`);
  const notify = useNotify();
  const [search, setSearch] = useState('');

  const rows = useMemo(
    () =>
      (data ?? []).filter((u) =>
        `${u.name} ${u.email} ${u.phone ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [data, search]
  );

  const remove = (user: User) =>
    notify.confirmDelete(`Delete ${user.name}?`, async () => {
      await api.delete(`/users/${user._id}`);
      notify.message.success('User deleted');
      await mutate();
    });

  const columns: ColumnsType<User> = [
    {
      title: 'Name',
      key: 'name',
      render: (_, u) => <UserCell name={u.name} email={u.email} />,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      render: (phone) => phone || '—',
      responsive: ['md'],
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      render: (g) => <GenderTag gender={g} />,
      responsive: ['lg'],
    },
    ...extraColumns,
  ];

  if (actions || canMessage || canDelete) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, u) => (
        <Space wrap>
          {actions?.(u, () => mutate())}
          {canMessage && <MessageButton userId={u._id} />}
          {canDelete && (
            <Tooltip title="Delete">
              <Button
                danger
                icon={<MdDeleteOutline />}
                onClick={() => remove(u)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    });
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        extra={
          <>
            <Input
              prefix={<MdSearch />}
              placeholder="Search"
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
            {headerExtra}
          </>
        }
      />
      <Card styles={{ body: { padding: 0 } }}>
        <Table<User>
          rowKey="_id"
          loading={isLoading}
          dataSource={rows}
          columns={columns}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          locale={emptyText ? { emptyText } : undefined}
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
}
