'use client';

import { Button, Descriptions, Drawer, Select, Tooltip } from 'antd';
import { useState } from 'react';
import { MdOutlineGroupAdd } from 'react-icons/md';
import AssignTeachersModal from '@/components/children/AssignTeachersModal';
import ChildrenTable from '@/components/children/ChildrenTable';
import { GenderTag } from '@/components/common/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useApi, useCurrentUser, useNotify } from '@/lib/hooks';
import { isAdminRole } from '@/lib/roles';
import type { Child, User } from '@/types/models';

interface Props {
  parent?: User | null;
  onClose: () => void;
  onChanged?: () => void;
}

/** Report fig. 3.20: parent information with children and their teachers. */
export default function ParentDetailsDrawer({
  parent,
  onClose,
  onChanged,
}: Props) {
  const me = useCurrentUser();
  const notify = useNotify();
  const admin = isAdminRole(me?.role);
  const {
    data: children,
    isLoading,
    mutate,
  } = useApi<Child[]>(parent ? `/children?parentId=${parent._id}` : null);
  const { data: mentors } = useApi<User[]>(
    parent && admin ? '/users?role=mentor' : null
  );
  const [assigning, setAssigning] = useState<Child | null>(null);

  const changeMentor = async (mentorId: string) => {
    if (!parent) return;
    try {
      await api.patch(`/users/${parent._id}/mentor`, { mentorId });
      notify.message.success('Mentor assigned');
      onChanged?.();
    } catch (e) {
      notify.error(e);
    }
  };

  return (
    <Drawer title={parent?.name} open={!!parent} onClose={onClose} width={760}>
      {parent && (
        <>
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
            <Descriptions.Item label="Email">{parent.email}</Descriptions.Item>
            <Descriptions.Item label="Phone">
              {parent.phone || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Gender">
              <GenderTag gender={parent.gender} />
            </Descriptions.Item>
            <Descriptions.Item label="Member since">
              {formatDate(parent.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Mentor" span={2}>
              {admin ? (
                <Select
                  className="w-64"
                  placeholder="Assign a mentor"
                  defaultValue={parent.mentor?._id}
                  onChange={changeMentor}
                  options={mentors?.map((m) => ({
                    value: m._id,
                    label: m.name,
                  }))}
                />
              ) : (
                parent.mentor?.name ?? '—'
              )}
            </Descriptions.Item>
          </Descriptions>
          <h3 className="mb-3 mt-6 font-semibold">Children</h3>
          <ChildrenTable
            data={children}
            loading={isLoading}
            emptyText="No child profile yet"
            actions={(child) => (
              <Tooltip title="Assign teachers">
                <Button
                  icon={<MdOutlineGroupAdd />}
                  onClick={() => setAssigning(child)}
                />
              </Tooltip>
            )}
          />
          <AssignTeachersModal
            child={assigning}
            onClose={() => setAssigning(null)}
            onSaved={() => mutate()}
          />
        </>
      )}
    </Drawer>
  );
}
