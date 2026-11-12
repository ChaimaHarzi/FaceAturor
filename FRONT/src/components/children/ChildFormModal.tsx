'use client';

import { DatePicker, Form, Input, Modal, Radio } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useNotify } from '@/lib/hooks';
import { Gender } from '@/lib/roles';
import type { Child } from '@/types/models';

interface Values {
  firstName: string;
  lastName: string;
  gender?: Gender;
  dateOfBirth?: Dayjs;
  grade: string;
  specialNeeds?: string;
}

interface Props {
  open: boolean;
  child?: Child | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ChildFormModal({
  open,
  child,
  onClose,
  onSaved,
}: Props) {
  const [form] = Form.useForm<Values>();
  const notify = useNotify();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (child)
      form.setFieldsValue({
        ...child,
        dateOfBirth: child.dateOfBirth ? dayjs(child.dateOfBirth) : undefined,
      });
  }, [open, child, form]);

  const submit = async (values: Values) => {
    setSaving(true);
    try {
      const body = {
        ...values,
        dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD'),
      };
      if (child) await api.patch(`/children/${child._id}`, body);
      else await api.post('/children', body);
      notify.message.success(child ? 'Profile updated' : 'Profile created');
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
      title={child ? 'Edit profile' : 'Add a child'}
      open={open}
      onCancel={onClose}
      onOk={form.submit}
      okText={child ? 'Save' : 'Add'}
      confirmLoading={saving}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
        requiredMark={false}
        initialValues={{ gender: Gender.MALE }}
      >
        <div className="grid gap-x-3 sm:grid-cols-2">
          <Form.Item
            name="firstName"
            label="First name"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="Last name"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="grade"
            label="Grade / class"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input placeholder="e.g. 5th grade" />
          </Form.Item>
          <Form.Item name="dateOfBirth" label="Date of birth">
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              disabledDate={(d) => d.isAfter(dayjs())}
            />
          </Form.Item>
        </div>
        <Form.Item name="gender" label="Gender">
          <Radio.Group>
            <Radio value={Gender.MALE}>Boy</Radio>
            <Radio value={Gender.FEMALE}>Girl</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          name="specialNeeds"
          label="Special needs"
          extra="Optional: helps the mentor choose the right teachers."
        >
          <Input.TextArea rows={2} maxLength={500} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
