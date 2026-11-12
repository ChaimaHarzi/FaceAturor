'use client';

import { Button } from 'antd';
import { useMemo, useState } from 'react';
import { MdAdd } from 'react-icons/md';
import CalendarView from '@/components/calendar/CalendarView';
import EventFormModal from '@/components/calendar/EventFormModal';
import { PageHeader } from '@/components/common/ui';
import { childName } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import type { SessionEvent } from '@/types/models';

export default function TeacherCalendarPage() {
  const { data, mutate } = useApi<SessionEvent[]>('/events');
  const [modal, setModal] = useState<{
    event?: SessionEvent;
    range?: { start: Date; end: Date };
  } | null>(null);

  const events = useMemo(
    () =>
      (data ?? []).map((e) => ({
        id: e._id,
        title: `${e.subject} – ${childName(e.child)}`,
        start: e.start,
        end: e.end,
      })),
    [data]
  );

  return (
    <div>
      <PageHeader
        title="My calendar"
        subtitle="Select a time slot to plan a session. It appears on the student’s calendar."
        extra={
          <Button type="primary" icon={<MdAdd />} onClick={() => setModal({})}>
            Add session
          </Button>
        }
      />
      <CalendarView
        events={events}
        onSelect={(range) => setModal({ range })}
        onEventClick={(id) =>
          setModal({ event: data?.find((e) => e._id === id) })
        }
      />
      <EventFormModal
        open={!!modal}
        event={modal?.event}
        range={modal?.range}
        onClose={() => setModal(null)}
        onSaved={() => mutate()}
      />
    </div>
  );
}
