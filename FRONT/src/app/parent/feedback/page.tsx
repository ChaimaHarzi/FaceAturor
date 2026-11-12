'use client';

import { Button, Card, Col, Empty, Form, Input, List, Rate, Row } from 'antd';
import { useState } from 'react';
import { PageHeader } from '@/components/common/ui';
import { api } from '@/lib/api';
import { fromNow } from '@/lib/format';
import { useApi, useNotify } from '@/lib/hooks';
import type { Feedback } from '@/types/models';

/** Report sprint 6 "Give feedback" about the platform. */
export default function ParentFeedbackPage() {
  const { data, mutate } = useApi<Feedback[]>('/feedback/mine');
  const notify = useNotify();
  const [form] = Form.useForm<{ rating: number; comment?: string }>();
  const [saving, setSaving] = useState(false);

  const send = async (values: { rating: number; comment?: string }) => {
    setSaving(true);
    try {
      await api.post('/feedback', values);
      notify.message.success('Thank you for your feedback!');
      form.resetFields();
      await mutate();
    } catch (e) {
      notify.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Feedback" subtitle="Help us improve Faceatutor." />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Give feedback">
            <Form
              form={form}
              layout="vertical"
              onFinish={send}
              requiredMark={false}
            >
              <Form.Item
                name="rating"
                label="What do you think of the platform?"
                rules={[{ required: true, message: 'Select a rating' }]}
              >
                <Rate style={{ fontSize: 34 }} />
              </Form.Item>
              <Form.Item name="comment" label="Comment">
                <Input.TextArea
                  rows={4}
                  maxLength={1000}
                  showCount
                  placeholder="Tell us about your experience"
                />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={saving}>
                Send
              </Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="My previous feedback">
            <List
              loading={!data}
              dataSource={data}
              locale={{ emptyText: <Empty description="No feedback yet" /> }}
              renderItem={(f) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <span className="flex items-center gap-2">
                        <Rate
                          disabled
                          value={f.rating}
                          style={{ fontSize: 13 }}
                        />
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
        </Col>
      </Row>
    </div>
  );
}
