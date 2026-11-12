'use client';

import { Button, Card, Col, Empty, Row, Skeleton, Tag, Tooltip } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  MdAdd,
  MdDeleteOutline,
  MdEdit,
  MdOutlineSchool,
} from 'react-icons/md';
import ChildFormModal from '@/components/children/ChildFormModal';
import { GenderTag, PageHeader, UserAvatar } from '@/components/common/ui';
import { api } from '@/lib/api';
import { ageFrom, childName } from '@/lib/format';
import { useApi, useNotify } from '@/lib/hooks';
import { useStudentStore } from '@/lib/student-store';
import type { Child } from '@/types/models';

export default function ParentChildrenPage() {
  const { data, isLoading, mutate } = useApi<Child[]>('/children');
  const notify = useNotify();
  const router = useRouter();
  const selectStudent = useStudentStore((s) => s.select);
  const [modal, setModal] = useState<{ child?: Child } | null>(null);

  const openStudentSpace = (child: Child) => {
    selectStudent(child._id, childName(child));
    router.push('/student/dashboard');
  };

  const remove = (child: Child) =>
    notify.confirmDelete(
      `Delete ${childName(child)}'s profile?`,
      async () => {
        await api.delete(`/children/${child._id}`);
        notify.message.success('Profile deleted');
        await mutate();
      },
      'Quiz results and sessions of this child will be deleted too.'
    );

  return (
    <div>
      <PageHeader
        title="My children"
        subtitle="Manage your children’s profiles and open their student space."
        extra={
          <Button type="primary" icon={<MdAdd />} onClick={() => setModal({})}>
            Add a child
          </Button>
        }
      />
      {isLoading && <Skeleton active />}
      {data && !data.length && (
        <Card>
          <Empty description="Add your first child to get started">
            <Button type="primary" onClick={() => setModal({})}>
              Add a child
            </Button>
          </Empty>
        </Card>
      )}
      <Row gutter={[16, 16]}>
        {data?.map((child) => (
          <Col key={child._id} xs={24} md={12} xl={8}>
            <Card
              className="h-full"
              actions={[
                <Tooltip key="edit" title="Edit">
                  <Button
                    type="text"
                    icon={<MdEdit />}
                    onClick={() => setModal({ child })}
                  />
                </Tooltip>,
                <Tooltip key="delete" title="Delete">
                  <Button
                    type="text"
                    danger
                    icon={<MdDeleteOutline />}
                    onClick={() => remove(child)}
                  />
                </Tooltip>,
              ]}
            >
              <div className="flex items-center gap-3">
                <UserAvatar name={childName(child)} size={52} />
                <div>
                  <div className="text-lg font-semibold">
                    {childName(child)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {child.grade} · {ageFrom(child.dateOfBirth)}
                  </div>
                </div>
                <span className="ml-auto">
                  <GenderTag gender={child.gender} />
                </span>
              </div>
              <div className="mt-4 text-sm">
                <div className="mb-1 text-gray-500">Teachers</div>
                {child.teachers.length ? (
                  <span className="flex flex-wrap gap-1">
                    {child.teachers.map((t) => (
                      <Tag key={t._id} color="blue" className="m-0">
                        {t.name}
                      </Tag>
                    ))}
                  </span>
                ) : (
                  <Tag color="orange">
                    Your mentor will assign teachers soon
                  </Tag>
                )}
              </div>
              {child.specialNeeds && (
                <div className="mt-3 text-sm">
                  <span className="text-gray-500">Special needs: </span>
                  {child.specialNeeds}
                </div>
              )}
              <Button
                type="primary"
                block
                className="mt-4"
                icon={<MdOutlineSchool />}
                onClick={() => openStudentSpace(child)}
              >
                Open student space
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
      <ChildFormModal
        open={!!modal}
        child={modal?.child}
        onClose={() => setModal(null)}
        onSaved={() => mutate()}
      />
    </div>
  );
}
