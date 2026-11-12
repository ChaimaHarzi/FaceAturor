'use client';

import {
  Alert,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/format';
import { useApi, useNotify } from '@/lib/hooks';
import type { Meeting, User } from '@/types/models';

interface Props {
  open: boolean;
  meeting?: Meeting | null;
  defaultParentId?: string;
  onClose: () => void;
  onSaved: () => void;
}

interface Values {
  title: string;
  parent: string;
  mentor: string;
  date: Dayjs;
  durationMinutes: number;
  link: string;
  notes?: string;
}

type Availability = {
  available: boolean;
  conflict: { title: string; date: string } | null;
};

export default function MeetingFormModal({
  open,
  meeting,
  defaultParentId,
  onClose,
  onSaved,
}: Props) {
  const [form] = Form.useForm<Values>();
  const notify = useNotify();
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<Availability>();
  const { data: parents } = useApi<User[]>(open ? '/users?role=parent' : null);
  const { data: mentors } = useApi<User[]>(open ? '/users?role=mentor' : null);

  const parentId = Form.useWatch('parent', form);
  const mentorId = Form.useWatch('mentor', form);
  const date = Form.useWatch('date', form);
  const duration = Form.useWatch('durationMinutes', form);
  const parent = parents?.find((p) => p._id === parentId);

  useEffect(() => {
    if (!open) return;
    setAvailability(undefined);
    form.setFieldsValue(
      meeting
        ? {
            title: meeting.title,
            parent: meeting.parent._id,
            mentor: meeting.mentor._id,
            date: dayjs(meeting.date),
            durationMinutes: meeting.durationMinutes,
            link: meeting.link,
            notes: meeting.notes,
          }
        : {
            title: 'First meeting',
            parent: defaultParentId,
            durationMinutes: 60,
          }
    );
  }, [open, meeting, defaultParentId, form]);

  // "Verify mentor availability" (report, sprint 2), checked live.
  useEffect(() => {
    if (!open || !mentorId || !date) return setAvailability(undefined);
    const params = new URLSearchParams({
      mentorId,
      date: date.toISOString(),
      durationMinutes: String(duration ?? 60),
      ...(meeting ? { excludeId: meeting._id } : {}),
    });
    const timer = setTimeout(() => {
      api
        .get<Availability>(`/meetings/availability?${params}`)
        .then((r) => setAvailability(r.data))
        .catch(() => undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [open, mentorId, date, duration, meeting]);

  const submit = async (values: Values) => {
    setSaving(true);
    try {
      const body = { ...values, date: values.date.toISOString() };
      if (meeting) await api.patch(`/meetings/${meeting._id}`, body);
      else await api.post('/meetings', body);
      notify.message.success(
        meeting
          ? 'Meeting updated, participants notified'
          : 'Meeting created, invitations sent by email'
      );
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
      title={meeting ? 'Edit meeting' : 'Schedule a meeting'}
      open={open}
      onCancel={onClose}
      onOk={form.submit}
      okText={meeting ? 'Save' : 'Create'}
      confirmLoading={saving}
      destroyOnClose
      width={560}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
        requiredMark={false}
      >
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, whitespace: true }]}
        >
          <Input />
        </Form.Item>
        <div className="grid gap-x-3 sm:grid-cols-2">
          <Form.Item name="parent" label="Parent" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              loading={!parents}
              options={parents?.map((p) => ({
                value: p._id,
                label: `${p.name}${p.accountStatus ? '' : ' (pending)'}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="mentor" label="Mentor" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              loading={!mentors}
              options={mentors?.map((m) => ({ value: m._id, label: m.name }))}
            />
          </Form.Item>
        </div>
        {parent?.availableFrom && (
          <Alert
            className="mb-4"
            type="info"
            showIcon
            message={`${parent.name} is available from ${formatDate(parent.availableFrom)} to ${formatDate(parent.availableTo)}`}
          />
        )}
        <div className="grid gap-x-3 sm:grid-cols-[1fr_140px]">
          <Form.Item
            name="date"
            label="Date and time"
            rules={[{ required: true }]}
          >
            <DatePicker
              showTime={{ format: 'HH:mm', minuteStep: 15 }}
              format="DD/MM/YYYY HH:mm"
              className="w-full"
            />
          </Form.Item>
          <Form.Item
            name="durationMinutes"
            label="Duration (min)"
            rules={[{ required: true }]}
          >
            <InputNumber min={15} max={240} step={15} className="w-full" />
          </Form.Item>
        </div>
        {availability && (
          <Alert
            className="mb-4"
            type={availability.available ? 'success' : 'warning'}
            showIcon
            message={
              availability.available
                ? 'The mentor is available at this time'
                : `The mentor is busy: "${availability.conflict?.title}" at ${formatDateTime(availability.conflict?.date)}`
            }
          />
        )}
        <Form.Item
          name="link"
          label="Meeting link (Zoom)"
          rules={[
            {
              required: true,
              type: 'url',
              message: 'Enter a valid link (https://...)',
            },
          ]}
        >
          <Input placeholder="https://zoom.us/j/..." />
        </Form.Item>
        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={2} maxLength={1000} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
