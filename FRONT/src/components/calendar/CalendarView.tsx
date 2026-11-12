'use client';

import type {
  DateSelectArg,
  EventClickArg,
  EventInput,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Card } from 'antd';

interface Props {
  events: EventInput[];
  onSelect?: (range: { start: Date; end: Date }) => void;
  onEventClick?: (id: string) => void;
}

/** Month / week / day calendar shared by every space. */
export default function CalendarView({
  events,
  onSelect,
  onEventClick,
}: Props) {
  return (
    <Card>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        firstDay={1}
        height="auto"
        nowIndicator
        eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        selectable={!!onSelect}
        select={(arg: DateSelectArg) =>
          onSelect?.({ start: arg.start, end: arg.end })
        }
        eventClick={(arg: EventClickArg) => {
          arg.jsEvent.preventDefault();
          onEventClick?.(arg.event.id);
        }}
        events={events}
      />
    </Card>
  );
}
