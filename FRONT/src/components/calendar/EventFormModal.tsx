'use client';

import { Button, DatePicker, Form, Input, Modal, Select } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { childName } from '@/lib/format';
import { useApi, useNotify } from '@/lib/hooks';
import type { Child, SessionEvent } from '@/types/models';

interface Props {
  open: boolean;
  event?: SessionEvent | null;
  range?: { start: Date; end: Date };
  onClose: () => void;
  onSaved: () => void;
}

interface Values {
  child: string;
  subject: string;
  description?: string;
  period: [Dayjs, Dayjs];
  link?: string;
}

/** Teacher calendar event ("SessionEvent"): shown on the student's calendar too. */
export default function EventFormModal({
  open,
  event,
  range,
  onClose,
  onSaved,
}: Props) {
  const [form] = Form.useForm<Values>();
  const notify = useNotify();
  const [saving, setSaving] = useState(false);
  const { data: students } = useApi<Child[]>(open ? '/children' : null);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (event) {
      form.setFieldsValue({
        child: event.child?._id,
        subject: event.subject,
        description: event.description,
        link: event.link,
        period: [dayjs(event.start), dayjs(event.end)],
      });
    } else if (range) {
      // A click on a day in month view selects the whole day: default to 1 hour at 17:00.
      const allDay = dayjs(range.end).diff(range.start, 'hour') >= 24;
      const start = allDay ? dayjs(range.start).hour(17) : dayjs(range.start);
      form.setFieldsValue({
        period: [start, allDay ? start.add(1, 'hour') : dayjs(range.end)],
      });
    }
  }, [open, event, range, form]);

  const submit = async ({ period, ...values }: Values) => {
    setSaving(true);
    try {
      const body = {
        ...values,
        start: period[0].toISOString(),
        end: period[1].toISOString(),
      };
      if (event) await api.patch(`/events/${event._id}`, body);
      else await api.post('/events', body);
      notify.message.success(
        event ? 'Session updated' : 'Session added to the calendars'
      );
      onSaved();
      onClose();
    } catch (e) {
      notify.error(e);
    } finally {
      setSaving(false);
    }
  };

  const remove = () =>
    event &&
    notify.confirmDelete('Delete this session?', async () => {
      await api.delete(`/events/${event._id}`);
      notify.message.success('Session deleted');
      onSaved();
      onClose();
    });

  return (
    <Modal
      title={event ? 'Edit session' : 'New session'}
      open={open}
      onCancel={onClose}
      destroyOnClose
      footer={[
        event && (
          <Button key="delete" danger onClick={remove}>
            Delete
          </Button>
        ),
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={saving}
          onClick={form.submit}
        >
          {event ? 'Save' : 'Add'}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
        requiredMark={false}
      >
        <Form.Item name="child" label="Student" rules={[{ required: true }]}>
          <Select
            loading={!students}
            placeholder="Select a student"
            notFoundContent="No student assigned to you yet"
            options={students?.map((c) => ({
              value: c._id,
              label: `${childName(c)} (${c.grade})`,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="subject"
          label="Subject"
          rules={[{ required: true, whitespace: true }]}
        >
          <Input placeholder="Mathematics" />
        </Form.Item>
        <Form.Item
          name="period"
          label="Date and time"
          rules={[{ required: true }]}
        >
          <DatePicker.RangePicker
            showTime={{ format: 'HH:mm', minuteStep: 15 }}
            format="DD/MM/YYYY HH:mm"
            className="w-full"
          />
        </Form.Item>
        <Form.Item
          name="link"
          label="Zoom link"
          rules={[{ type: 'url', message: 'Enter a valid link (https://...)' }]}
        >
          <Input placeholder="https://zoom.us/j/..." />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} maxLength={1000} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
