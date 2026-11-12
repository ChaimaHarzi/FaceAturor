'use client';

import { Button, Card, Empty, List } from 'antd';
import { MdOutlineVideoCall } from 'react-icons/md';
import { formatDateTime, fromNow } from '@/lib/format';
import type { Meeting } from '@/types/models';

export default function UpcomingMeetings({
  meetings,
  title = 'Upcoming meetings',
}: {
  meetings?: Meeting[];
  title?: string;
}) {
  return (
    <Card title={title} className="h-full">
      <List
        loading={!meetings}
        dataSource={meetings}
        locale={{ emptyText: <Empty description="No upcoming meeting" /> }}
        renderItem={(m) => (
          <List.Item
            actions={[
              <a key="join" href={m.link} target="_blank" rel="noreferrer">
                <Button
                  size="small"
                  type="primary"
                  icon={<MdOutlineVideoCall />}
                >
                  Join
                </Button>
              </a>,
            ]}
          >
            <List.Item.Meta
              title={m.title}
              description={`${formatDateTime(m.date)} (${fromNow(m.date)}) · ${m.parent?.name ?? ''}`}
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
