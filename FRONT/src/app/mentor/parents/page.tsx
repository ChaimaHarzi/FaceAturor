'use client';

import { Button } from 'antd';
import { useState } from 'react';
import ParentDetailsDrawer from '@/components/users/ParentDetailsDrawer';
import UsersDirectory from '@/components/users/UsersDirectory';
import type { User } from '@/types/models';

export default function MentorParentsPage() {
  const [selected, setSelected] = useState<User | null>(null);
  return (
    <>
      <UsersDirectory
        title="My families"
        subtitle="Parents you follow. Open a family to match each child with suitable teachers."
        query="role=parent"
        canMessage
        emptyText="No family assigned yet"
        actions={(u) => (
          <Button onClick={() => setSelected(u)}>Children & teachers</Button>
        )}
      />
      <ParentDetailsDrawer
        parent={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
