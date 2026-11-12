'use client';

import { Button, Descriptions, Modal } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { MdOutlineVideoCall } from 'react-icons/md';
import CalendarView from '@/components/calendar/CalendarView';
import { PageHeader } from '@/components/common/ui';
import { formatDateTime } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import type { Meeting } from '@/types/models';

export default function MentorCalendarPage() {
  const { data } = useApi<Meeting[]>('/meetings');
  const [selected, setSelected] = useState<Meeting>();

  const events = useMemo(
    () =>
      (data ?? []).map((m) => ({
        id: m._id,
        title: `${m.title} – ${m.parent?.name ?? ''}`,
        start: m.date,
        end: dayjs(m.date).add(m.durationMinutes, 'minute').toISOString(),
      })),
    [data]
  );

  return (
    <div>
      <PageHeader
        title="My meetings"
        subtitle="Meetings with parents scheduled by the administration."
      />
      <CalendarView
        events={events}
        onEventClick={(id) => setSelected(data?.find((m) => m._id === id))}
      />
      <Modal
        title={selected?.title}
        open={!!selected}
        onCancel={() => setSelected(undefined)}
        footer={
          selected && (
            <a href={selected.link} target="_blank" rel="noreferrer">
              <Button type="primary" icon={<MdOutlineVideoCall />}>
                Join the meeting
              </Button>
            </a>
          )
        }
      >
        {selected && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Date">
              {formatDateTime(selected.date)} ({selected.durationMinutes} min)
            </Descriptions.Item>
            <Descriptions.Item label="Parent">
              {selected.parent?.name} · {selected.parent?.email}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {selected.parent?.phone || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Notes">
              {selected.notes || '—'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
