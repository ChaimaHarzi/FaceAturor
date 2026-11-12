'use client';

import { Button, Descriptions, Modal } from 'antd';
import { useMemo, useState } from 'react';
import { MdOutlineVideoCall } from 'react-icons/md';
import CalendarView from '@/components/calendar/CalendarView';
import { PageHeader } from '@/components/common/ui';
import { formatDateTime, formatTime } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import { useStudentStore } from '@/lib/student-store';
import type { SessionEvent } from '@/types/models';

export default function StudentCalendarPage() {
  const childId = useStudentStore((s) => s.childId);
  const { data } = useApi<SessionEvent[]>(
    childId ? `/events?childId=${childId}` : null
  );
  const [selected, setSelected] = useState<SessionEvent>();

  const events = useMemo(
    () =>
      (data ?? []).map((e) => ({
        id: e._id,
        title: `${e.subject} – ${e.teacher?.name ?? ''}`,
        start: e.start,
        end: e.end,
      })),
    [data]
  );

  return (
    <div>
      <PageHeader
        title="My calendar"
        subtitle="Sessions planned by your teachers."
      />
      <CalendarView
        events={events}
        onEventClick={(id) => setSelected(data?.find((e) => e._id === id))}
      />
      <Modal
        title={selected?.subject}
        open={!!selected}
        onCancel={() => setSelected(undefined)}
        footer={
          selected?.link && (
            <a href={selected.link} target="_blank" rel="noreferrer">
              <Button type="primary" icon={<MdOutlineVideoCall />}>
                Join the session
              </Button>
            </a>
          )
        }
      >
        {selected && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="When">
              {formatDateTime(selected.start)} – {formatTime(selected.end)}
            </Descriptions.Item>
            <Descriptions.Item label="Teacher">
              {selected.teacher?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Details">
              {selected.description || '—'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
