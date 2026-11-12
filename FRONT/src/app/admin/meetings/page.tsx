'use client';

import { Button, Card, Segmented, Space, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import {
  MdAdd,
  MdDeleteOutline,
  MdEdit,
  MdOutlineVideoCall,
} from 'react-icons/md';
import { PageHeader, UserCell } from '@/components/common/ui';
import MeetingFormModal from '@/components/meetings/MeetingFormModal';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { useApi, useNotify } from '@/lib/hooks';
import type { Meeting } from '@/types/models';

export default function MeetingsPage() {
  const { data, isLoading, mutate } = useApi<Meeting[]>('/meetings');
  const notify = useNotify();
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    const now = dayjs();
    return (data ?? []).filter((m) =>
      filter === 'all'
        ? true
        : filter === 'upcoming'
          ? dayjs(m.date).isAfter(now)
          : !dayjs(m.date).isAfter(now)
    );
  }, [data, filter]);

  const remove = (m: Meeting) =>
    notify.confirmDelete(`Cancel "${m.title}"?`, async () => {
      await api.delete(`/meetings/${m._id}`);
      notify.message.success('Meeting cancelled, participants notified');
      await mutate();
    });

  const columns: ColumnsType<Meeting> = [
    {
      title: 'Meeting',
      dataIndex: 'title',
      render: (title, m) => (
        <>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-gray-500">{m.durationMinutes} min</div>
        </>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      render: (d) => formatDateTime(d),
      sorter: (a, b) => dayjs(a.date).diff(b.date),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Parent',
      key: 'parent',
      render: (_, m) => (
        <UserCell name={m.parent?.name} email={m.parent?.email} />
      ),
    },
    {
      title: 'Mentor',
      key: 'mentor',
      render: (_, m) => (
        <UserCell name={m.mentor?.name} email={m.mentor?.email} />
      ),
    },
    {
      title: 'Created by',
      key: 'createdBy',
      render: (_, m) => m.createdBy?.name ?? '—',
      responsive: ['xl'],
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, m) =>
        dayjs(m.date).isAfter(dayjs()) ? (
          <Tag color="blue">Upcoming</Tag>
        ) : (
          <Tag>Done</Tag>
        ),
      responsive: ['md'],
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, m) => (
        <Space>
          <Tooltip title="Open link">
            <a href={m.link} target="_blank" rel="noreferrer">
              <Button icon={<MdOutlineVideoCall />} />
            </a>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              icon={<MdEdit />}
              onClick={() => {
                setEditing(m);
                setOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Cancel meeting">
            <Button
              danger
              icon={<MdDeleteOutline />}
              onClick={() => remove(m)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Meetings"
        subtitle="Parent–mentor meetings. Invitations are sent by email."
        extra={
          <>
            <Segmented
              value={filter}
              onChange={(v) => setFilter(v as typeof filter)}
              options={[
                { label: 'Upcoming', value: 'upcoming' },
                { label: 'Past', value: 'past' },
                { label: 'All', value: 'all' },
              ]}
            />
            <Button
              type="primary"
              icon={<MdAdd />}
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              Add meeting
            </Button>
          </>
        }
      />
      <Card styles={{ body: { padding: 0 } }}>
        <Table<Meeting>
          rowKey="_id"
          loading={isLoading}
          dataSource={rows}
          columns={columns}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: true }}
        />
      </Card>
      <MeetingFormModal
        open={open}
        meeting={editing}
        onClose={() => setOpen(false)}
        onSaved={() => mutate()}
      />
    </div>
  );
}
