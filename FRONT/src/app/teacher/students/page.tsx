'use client';

import { Card } from 'antd';
import ChildrenTable from '@/components/children/ChildrenTable';
import { PageHeader } from '@/components/common/ui';
import { MessageButton } from '@/components/users/UsersDirectory';
import { useApi } from '@/lib/hooks';
import type { Child, UserRef } from '@/types/models';

/** Report: the teacher consults the parents they are responsible for. */
export default function TeacherStudentsPage() {
  const { data, isLoading } = useApi<Child[]>('/children');
  return (
    <div>
      <PageHeader
        title="My students"
        subtitle="Students assigned to you by their mentor, and their parents."
      />
      <Card styles={{ body: { padding: 0 } }}>
        <ChildrenTable
          data={data}
          loading={isLoading}
          showParent
          emptyText="No student assigned to you yet"
          actions={(c) => (
            <MessageButton userId={(c.parent as UserRef)._id} label="Parent" />
          )}
        />
      </Card>
    </div>
  );
}
