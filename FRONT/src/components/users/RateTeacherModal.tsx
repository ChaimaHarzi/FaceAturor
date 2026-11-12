'use client';

import { Form, Input, Modal, Rate } from 'antd';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useNotify } from '@/lib/hooks';
import type { TeacherRating } from '@/types/models';

interface Props {
  teacher?: { _id: string; name: string } | null;
  current?: TeacherRating;
  onClose: () => void;
  onSaved: () => void;
}

/** Report sprint 6 "Evaluate teacher": one editable evaluation per teacher. */
export default function RateTeacherModal({
  teacher,
  current,
  onClose,
  onSaved,
}: Props) {
  const [form] = Form.useForm<{ score: number; description?: string }>();
  const notify = useNotify();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (teacher)
      form.setFieldsValue({
        score: current?.score,
        description: current?.description,
      });
  }, [teacher, current, form]);

  const submit = async (values: { score: number; description?: string }) => {
    if (!teacher) return;
    setSaving(true);
    try {
      await api.post('/ratings', { teacher: teacher._id, ...values });
      notify.message.success('Thank you for your evaluation');
      onSaved();
      onClose();
    } catch (e) {
      notify.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Evaluate ${teacher?.name ?? ''}`}
      open={!!teacher}
      onCancel={onClose}
      onOk={form.submit}
      okText="Send"
      confirmLoading={saving}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
        requiredMark={false}
      >
        <Form.Item
          name="score"
          label="Your rating"
          rules={[{ required: true, message: 'Select a rating' }]}
        >
          <Rate style={{ fontSize: 32 }} />
        </Form.Item>
        <Form.Item name="description" label="Comment">
          <Input.TextArea
            rows={3}
            maxLength={1000}
            placeholder="How does this teacher work with your child?"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
