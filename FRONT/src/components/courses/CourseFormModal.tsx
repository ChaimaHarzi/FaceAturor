'use client';

import { Button, Form, Input, Modal, Select, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useEffect, useState } from 'react';
import { MdUploadFile } from 'react-icons/md';
import { api } from '@/lib/api';
import { childName } from '@/lib/format';
import { useApi, useNotify } from '@/lib/hooks';
import type { Child, Course } from '@/types/models';

interface Values {
  title: string;
  subject: string;
  description?: string;
  link?: string;
  children?: string[];
}

interface Props {
  open: boolean;
  course?: Course | null;
  onClose: () => void;
  onSaved: () => void;
}

const MAX_SIZE = 20 * 1024 * 1024;

export default function CourseFormModal({
  open,
  course,
  onClose,
  onSaved,
}: Props) {
  const [form] = Form.useForm<Values>();
  const notify = useNotify();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [saving, setSaving] = useState(false);
  const { data: students } = useApi<Child[]>(open ? '/children' : null);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    setFiles([]);
    if (course)
      form.setFieldsValue({
        ...course,
        children: course.children.map((c) => c._id),
      });
  }, [open, course, form]);

  const submit = async (values: Values) => {
    const file = files[0]?.originFileObj;
    if (!file && !values.link && !course?.fileUrl) {
      notify.message.warning('Add a file or a link');
      return;
    }
    const data = new FormData();
    data.append('title', values.title);
    data.append('subject', values.subject);
    data.append('description', values.description ?? '');
    data.append('link', values.link ?? '');
    data.append('children', JSON.stringify(values.children ?? []));
    if (file) data.append('file', file);

    setSaving(true);
    try {
      if (course) await api.patch(`/courses/${course._id}`, data);
      else await api.post('/courses', data);
      notify.message.success(course ? 'Course updated' : 'Course published');
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
      title={course ? 'Edit course' : 'New course'}
      open={open}
      onCancel={onClose}
      onOk={form.submit}
      okText={course ? 'Save' : 'Publish'}
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
        <div className="grid gap-x-3 sm:grid-cols-2">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input placeholder="Mathematics" />
          </Form.Item>
        </div>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} maxLength={1000} />
        </Form.Item>
        <Form.Item
          name="link"
          label="Link (video, website...)"
          rules={[{ type: 'url', message: 'Enter a valid link (https://...)' }]}
        >
          <Input placeholder="https://..." />
        </Form.Item>
        <Form.Item
          label="File"
          extra={
            course?.fileName
              ? `Current file: ${course.fileName}. Upload a new one to replace it.`
              : 'PDF, Office document, image or video (20 MB max)'
          }
        >
          <Upload
            fileList={files}
            maxCount={1}
            beforeUpload={(file) => {
              if (file.size > MAX_SIZE) {
                notify.message.error('The file must be under 20 MB');
                return Upload.LIST_IGNORE;
              }
              return false; // uploaded with the form
            }}
            onChange={({ fileList }) => setFiles(fileList)}
          >
            <Button icon={<MdUploadFile />}>Choose a file</Button>
          </Upload>
        </Form.Item>
        <Form.Item name="children" label="Share with">
          <Select
            mode="multiple"
            loading={!students}
            placeholder="Select students"
            notFoundContent="No student assigned to you yet"
            optionFilterProp="label"
            options={students?.map((c) => ({
              value: c._id,
              label: `${childName(c)} (${c.grade})`,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
