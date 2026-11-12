'use client';

import { Card, Col, Empty, List, Rate, Row } from 'antd';
import { PageHeader, StatCard, UserAvatar } from '@/components/common/ui';
import { fromNow } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import type { Feedback } from '@/types/models';

interface FeedbackList {
  average: number | null;
  count: number;
  items: Feedback[];
}

export default function AdminFeedbackPage() {
  const { data } = useApi<FeedbackList>('/feedback');
  return (
    <div>
      <PageHeader
        title="Feedback"
        subtitle="What parents think about Faceatutor."
      />
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            label="Average rating"
            value={data?.average !== null && data ? `${data.average} / 5` : '—'}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard label="Feedback received" value={data?.count ?? '—'} />
        </Col>
      </Row>
      <Card>
        <List
          loading={!data}
          dataSource={data?.items}
          locale={{ emptyText: <Empty description="No feedback yet" /> }}
          renderItem={(f) => (
            <List.Item>
              <List.Item.Meta
                avatar={<UserAvatar name={f.parent?.name} />}
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {f.parent?.name ?? 'Deleted parent'}
                    <Rate disabled value={f.rating} style={{ fontSize: 13 }} />
                    <span className="text-xs font-normal text-gray-400">
                      {fromNow(f.createdAt)}
                    </span>
                  </span>
                }
                description={f.comment || <i>No comment</i>}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
