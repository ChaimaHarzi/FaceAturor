'use client';

import { Alert, Button, Col, Row, Skeleton } from 'antd';
import Link from 'next/link';
import {
  MdOutlineChildCare,
  MdOutlineFamilyRestroom,
  MdOutlineSchool,
  MdOutlineVideoCall,
} from 'react-icons/md';
import { PageHeader, StatCard } from '@/components/common/ui';
import UpcomingMeetings from '@/components/meetings/UpcomingMeetings';
import { useApi, useCurrentUser } from '@/lib/hooks';
import type { Meeting } from '@/types/models';

interface MentorStats {
  parents: number;
  children: number;
  childrenWithoutTeacher: number;
  teachers: number;
  totalMeetings: number;
  upcomingMeetings: Meeting[];
}

export default function MentorDashboard() {
  const user = useCurrentUser();
  const { data: stats } = useApi<MentorStats>('/stats');

  if (!stats) return <Skeleton active />;
  return (
    <div>
      <PageHeader
        title={`Hello ${user?.name ?? ''}`}
        subtitle="Follow your families and guide each child."
      />
      {stats.childrenWithoutTeacher > 0 && (
        <Alert
          className="mb-5"
          type="warning"
          showIcon
          message={`${stats.childrenWithoutTeacher} child(ren) still have no teacher`}
          action={
            <Link href="/mentor/parents">
              <Button size="small">Assign teachers</Button>
            </Link>
          }
        />
      )}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            label="Families followed"
            value={stats.parents}
            icon={<MdOutlineFamilyRestroom />}
            color="#f59e0b"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            label="Children"
            value={stats.children}
            icon={<MdOutlineChildCare />}
            color="#ec4899"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            label="Meetings"
            value={stats.totalMeetings}
            icon={<MdOutlineVideoCall />}
            color="#0891b2"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            label="Teachers available"
            value={stats.teachers}
            icon={<MdOutlineSchool />}
          />
        </Col>
      </Row>
      <div className="mt-4">
        <UpcomingMeetings meetings={stats.upcomingMeetings} />
      </div>
    </div>
  );
}
