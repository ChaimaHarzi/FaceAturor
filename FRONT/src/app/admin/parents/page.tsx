'use client';

import { Button, Tag } from 'antd';
import { useState } from 'react';
import ParentDetailsDrawer from '@/components/users/ParentDetailsDrawer';
import UsersDirectory from '@/components/users/UsersDirectory';
import { formatDate } from '@/lib/format';
import type { User } from '@/types/models';

export default function AdminParentsPage() {
  const [selected, setSelected] = useState<{
    user: User;
    refresh: () => void;
  } | null>(null);
  return (
    <>
      <UsersDirectory
        title="Parents"
        subtitle="Families, their children and the teachers who follow them."
        query="role=parent"
        canDelete
        extraColumns={[
          {
            title: 'Mentor',
            key: 'mentor',
            render: (_, u) => u.mentor?.name ?? <Tag color="orange">None</Tag>,
          },
          {
            title: 'Status',
            dataIndex: 'accountStatus',
            render: (active) =>
              active ? (
                <Tag color="green">Active</Tag>
              ) : (
                <Tag color="gold">Pending</Tag>
              ),
          },
          {
            title: 'Since',
            dataIndex: 'createdAt',
            render: (d) => formatDate(d),
            responsive: ['xl'],
          },
        ]}
        actions={(u, refresh) => (
          <Button onClick={() => setSelected({ user: u, refresh })}>
            Details
          </Button>
        )}
      />
      <ParentDetailsDrawer
        parent={selected?.user}
        onClose={() => setSelected(null)}
        onChanged={() => selected?.refresh()}
      />
    </>
  );
}
