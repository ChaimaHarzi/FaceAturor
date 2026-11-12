'use client';

import { Button, Card, Empty, List } from 'antd';
import { MdOutlineVideoCall } from 'react-icons/md';
import { childName, formatDateTime, fromNow } from '@/lib/format';
import type { SessionEvent } from '@/types/models';

export default function UpcomingSessions({
  sessions,
  show = 'child',
}: {
  sessions?: SessionEvent[];
  show?: 'child' | 'teacher';
}) {
  return (
    <Card title="Upcoming sessions" className="h-full">
      <List
        loading={!sessions}
        dataSource={sessions}
        locale={{ emptyText: <Empty description="No upcoming session" /> }}
        renderItem={(s) => (
          <List.Item
            actions={
              s.link
                ? [
                    <a
                      key="join"
                      href={s.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button size="small" icon={<MdOutlineVideoCall />}>
                        Join
                      </Button>
                    </a>,
                  ]
                : []
            }
          >
            <List.Item.Meta
              title={`${s.subject} · ${show === 'child' ? childName(s.child) : s.teacher?.name ?? ''}`}
              description={`${formatDateTime(s.start)} (${fromNow(s.start)})`}
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
