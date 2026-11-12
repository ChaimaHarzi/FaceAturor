'use client';

import { Button, Form, Modal, Select, Tag, Tooltip } from 'antd';
import { useState } from 'react';
import { MdCheck, MdOutlineVideoCall } from 'react-icons/md';
import MeetingFormModal from '@/components/meetings/MeetingFormModal';
import UsersDirectory from '@/components/users/UsersDirectory';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useApi, useNotify } from '@/lib/hooks';
import type { Meeting, User } from '@/types/models';

/**
 * Report, "Manage pending accounts": after the first meeting with a mentor the
 * admin activates (assigning that mentor) or deletes the parent account.
 */
export default function PendingAccountsPage() {
  const notify = useNotify();
  const { data: mentors } = useApi<User[]>('/users?role=mentor');
  const { data: meetings, mutate: refreshMeetings } =
    useApi<Meeting[]>('/meetings');
  const [scheduleFor, setScheduleFor] = useState<string>();
  const [activating, setActivating] = useState<{
    user: User;
    refresh: () => void;
  }>();
  const [mentorId, setMentorId] = useState<string>();
  const [saving, setSaving] = useState(false);

  const meetingOf = (parentId: string) =>
    meetings?.find((m) => m.parent?._id === parentId);

  const startActivation = (user: User, refresh: () => void) => {
    setMentorId(meetingOf(user._id)?.mentor._id ?? user.mentor?._id);
    setActivating({ user, refresh });
  };

  const activate = async () => {
    if (!activating) return;
    setSaving(true);
    try {
      await api.patch(`/users/${activating.user._id}/activate`, { mentorId });
      notify.message.success(`${activating.user.name} is now active`);
      activating.refresh();
      setActivating(undefined);
    } catch (e) {
      notify.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <UsersDirectory
        title="Pending accounts"
        subtitle="New parents waiting for their first meeting with a mentor."
        query="status=pending"
        canDelete
        emptyText="No pending account"
        extraColumns={[
          {
            title: 'Availability',
            key: 'availability',
            render: (_, u) =>
              u.availableFrom
                ? `${formatDate(u.availableFrom)} → ${formatDate(u.availableTo)}`
                : '—',
          },
          {
            title: 'Email',
            key: 'verified',
            render: (_, u) =>
              u.emailVerified === false ? (
                <Tag color="orange">Not verified</Tag>
              ) : (
                <Tag color="green">Verified</Tag>
              ),
            responsive: ['lg'],
          },
          {
            title: 'First meeting',
            key: 'meeting',
            render: (_, u) => {
              const meeting = meetingOf(u._id);
              return meeting ? (
                <Tag color="blue">
                  {formatDate(meeting.date)} · {meeting.mentor.name}
                </Tag>
              ) : (
                <Tag>Not scheduled</Tag>
              );
            },
          },
        ]}
        actions={(u, refresh) => (
          <>
            <Tooltip title="Schedule the first meeting">
              <Button
                icon={<MdOutlineVideoCall />}
                onClick={() => setScheduleFor(u._id)}
              />
            </Tooltip>
            <Button
              type="primary"
              icon={<MdCheck />}
              onClick={() => startActivation(u, refresh)}
            >
              Activate
            </Button>
          </>
        )}
      />

      <MeetingFormModal
        open={!!scheduleFor}
        defaultParentId={scheduleFor}
        onClose={() => setScheduleFor(undefined)}
        onSaved={() => refreshMeetings()}
      />

      <Modal
        title={`Activate ${activating?.user.name ?? ''}`}
        open={!!activating}
        onCancel={() => setActivating(undefined)}
        onOk={activate}
        okText="Activate"
        confirmLoading={saving}
      >
        <p className="mb-4 text-gray-600">
          The parent will be notified by email. Choose the mentor who will
          follow this family.
        </p>
        <Form layout="vertical">
          <Form.Item label="Mentor">
            <Select
              allowClear
              value={mentorId}
              onChange={setMentorId}
              placeholder="Select a mentor"
              options={mentors?.map((m) => ({ value: m._id, label: m.name }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
