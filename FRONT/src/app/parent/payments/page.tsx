'use client';

import {
  Alert,
  Button,
  Form,
  InputNumber,
  Modal,
  Radio,
  Select,
  Input,
} from 'antd';
import { useState } from 'react';
import { MdAdd } from 'react-icons/md';
import { PageHeader } from '@/components/common/ui';
import PaymentsTable from '@/components/payments/PaymentsTable';
import { api } from '@/lib/api';
import { childName, formatMoney } from '@/lib/format';
import { useApi, useNotify } from '@/lib/hooks';
import type { Child, Payment } from '@/types/models';

interface Values {
  child: string;
  teacher: string;
  formation: string;
  amount: number;
  method: Payment['method'];
}

export default function ParentPaymentsPage() {
  const { data, isLoading, mutate } = useApi<Payment[]>('/payments');
  const { data: children } = useApi<Child[]>('/children');
  const notify = useNotify();
  const [form] = Form.useForm<Values>();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const childId = Form.useWatch('child', form);
  const teachers = children?.find((c) => c._id === childId)?.teachers ?? [];
  const total = (data ?? []).reduce(
    (sum, p) => sum + (p.status === 'paid' ? p.amount : 0),
    0
  );

  const pay = async (values: Values) => {
    setSaving(true);
    try {
      const { data: payment } = await api.post<Payment>('/payments', values);
      notify.modal.success({
        title: 'Payment confirmed',
        content: `${formatMoney(payment.amount)} paid. Reference ${payment.reference}. A receipt has been sent by email.`,
      });
      setOpen(false);
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
      <PageHeader
        title="My payments"
        subtitle={`Enrol your children with their teachers. Total paid: ${formatMoney(total)}`}
        extra={
          <Button type="primary" icon={<MdAdd />} onClick={() => setOpen(true)}>
            Make a payment
          </Button>
        }
      />
      <PaymentsTable data={data} loading={isLoading} />

      <Modal
        title="Make a payment"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={form.submit}
        okText="Pay"
        confirmLoading={saving}
        destroyOnClose
      >
        <Alert
          className="mb-4"
          type="info"
          showIcon
          message="Demo mode: payments are recorded but no card is charged."
        />
        <Form
          form={form}
          layout="vertical"
          onFinish={pay}
          requiredMark={false}
          initialValues={{ method: 'card' }}
          preserve={false}
        >
          <Form.Item name="child" label="Child" rules={[{ required: true }]}>
            <Select
              placeholder="Select a child"
              options={children?.map((c) => ({
                value: c._id,
                label: childName(c),
              }))}
              onChange={() => form.setFieldValue('teacher', undefined)}
            />
          </Form.Item>
          <Form.Item
            name="teacher"
            label="Teacher"
            rules={[{ required: true }]}
          >
            <Select
              placeholder={
                childId ? 'Select a teacher' : 'Select a child first'
              }
              disabled={!childId}
              notFoundContent="No teacher assigned to this child yet"
              options={teachers.map((t) => ({
                value: t._id,
                label: `${t.name}${t.expertise?.length ? ` — ${t.expertise.join(', ')}` : ''}`,
              }))}
              onChange={(id: string) => {
                const subject = teachers.find((t) => t._id === id)
                  ?.expertise?.[0];
                if (subject && !form.getFieldValue('formation'))
                  form.setFieldValue('formation', subject);
              }}
            />
          </Form.Item>
          <Form.Item
            name="formation"
            label="Formation"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input placeholder="Mathematics – term 1" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount (TND)"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={100000} step={10} className="w-full" />
          </Form.Item>
          <Form.Item name="method" label="Payment method">
            <Radio.Group>
              <Radio value="card">Card</Radio>
              <Radio value="transfer">Bank transfer</Radio>
              <Radio value="cash">Cash</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
