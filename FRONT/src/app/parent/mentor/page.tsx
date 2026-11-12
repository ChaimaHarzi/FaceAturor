'use client';

import { Card, Col, Descriptions, Result, Row, Skeleton } from 'antd';
import dayjs from 'dayjs';
import { GenderTag, PageHeader, UserAvatar } from '@/components/common/ui';
import UpcomingMeetings from '@/components/meetings/UpcomingMeetings';
import { MessageButton } from '@/components/users/UsersDirectory';
import { useApi } from '@/lib/hooks';
import type { Meeting, User } from '@/types/models';

export default function ParentMentorPage() {
  const { data: mentor, isLoading } = useApi<User | null>('/users/me/mentor');
  const { data: meetings } = useApi<Meeting[]>('/meetings');
  const upcoming = meetings?.filter((m) => dayjs(m.date).isAfter(dayjs()));

  if (isLoading) return <Skeleton active avatar />;
  if (!mentor) {
    return (
      <Result
        status="info"
        title="No mentor assigned yet"
        subTitle="The administration will assign you a mentor very soon."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="My mentor"
        subtitle="Your mentor follows your children’s journey and is your first contact."
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card className="h-full text-center">
            <UserAvatar name={mentor.name} size={80} />
            <div className="mt-3 text-xl font-semibold">{mentor.name}</div>
            <div className="text-gray-500">Mentor</div>
            <Descriptions
              className="mt-4 text-left"
              column={1}
              size="small"
              bordered
            >
              <Descriptions.Item label="Email">
                {mentor.email}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {mentor.phone || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Gender">
                <GenderTag gender={mentor.gender} />
              </Descriptions.Item>
            </Descriptions>
            <div className="mt-4">
              <MessageButton userId={mentor._id} label="Send a message" />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <UpcomingMeetings
            meetings={upcoming}
            title="My meetings with the mentor"
          />
        </Col>
      </Row>
    </div>
  );
}
