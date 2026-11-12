'use client';

import { Button, Card, Form, Input, Radio, Select, Space } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { MdRefresh } from 'react-icons/md';
import { PageHeader } from '@/components/common/ui';
import { api } from '@/lib/api';
import { useCurrentUser, useNotify } from '@/lib/hooks';
import { Gender, Role, roleLabels } from '@/lib/roles';

interface Values {
  role: Role;
  name: string;
  email: string;
  phone?: string;
  gender: Gender;
  password: string;
  expertise?: string[];
  qualifications?: string[];
  bio?: string;
}

const listFor: Record<number, string> = {
  [Role.ADMIN]: '/admin/admins',
  [Role.MENTOR]: '/admin/mentors',
  [Role.TEACHER]: '/admin/teachers',
  [Role.PARENT]: '/admin/parents',
};

/** Random password meeting the API policy (letters + digits, 12 chars). */
const generatePassword = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
  const digits = '23456789';
  const pick = (set: string) =>
    set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length];
  return (
    Array.from({ length: 9 }, () => pick(chars)).join('') +
    pick(digits) +
    pick(digits) +
    pick(digits)
  );
};

function NewUserForm() {
  const me = useCurrentUser();
  const router = useRouter();
  const params = useSearchParams();
  const notify = useNotify();
  const [form] = Form.useForm<Values>();
  const [saving, setSaving] = useState(false);
  const role = Form.useWatch('role', form);

  const roles = [
    Role.MENTOR,
    Role.TEACHER,
    Role.PARENT,
    ...(me?.role === Role.SUPER_ADMIN ? [Role.ADMIN] : []),
  ];
  const requested = Number(params.get('role')) as Role;
  const initialRole = roles.includes(requested) ? requested : Role.TEACHER;

  const submit = async (values: Values) => {
    setSaving(true);
    try {
      await api.post('/users', values);
      notify.modal.success({
        title: `${roleLabels[values.role]} account created`,
        content: `An email has been sent to ${values.email}. Temporary password: ${values.password}`,
      });
      router.push(listFor[values.role]);
    } catch (e) {
      notify.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Add a user"
        subtitle="Create an account for a mentor, a teacher, a parent or an admin."
      />
      <Card>
        <Form<Values>
          form={form}
          layout="vertical"
          onFinish={submit}
          requiredMark={false}
          initialValues={{
            role: initialRole,
            gender: Gender.MALE,
            password: generatePassword(),
          }}
        >
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={roles.map((r) => ({ value: r, label: roleLabels[r] }))}
            />
          </Form.Item>
          <div className="grid gap-x-3 sm:grid-cols-2">
            <Form.Item
              name="name"
              label="Full name"
              rules={[{ required: true, whitespace: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, type: 'email' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="phone"
              label="Phone"
              rules={[
                {
                  pattern: /^[+\d\s-]{0,20}$/,
                  message: 'Enter a valid phone number',
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="gender" label="Gender">
              <Radio.Group>
                <Radio value={Gender.MALE}>Male</Radio>
                <Radio value={Gender.FEMALE}>Female</Radio>
              </Radio.Group>
            </Form.Item>
          </div>
          <Form.Item label="Temporary password" required>
            <Space.Compact className="w-full">
              <Form.Item
                name="password"
                noStyle
                rules={[
                  {
                    required: true,
                    pattern: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
                    message: '8+ characters with letters and numbers',
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <Button
                icon={<MdRefresh />}
                onClick={() =>
                  form.setFieldValue('password', generatePassword())
                }
              >
                Generate
              </Button>
            </Space.Compact>
          </Form.Item>
          {role === Role.TEACHER && (
            <>
              <Form.Item name="expertise" label="Expertise (subjects)">
                <Select mode="tags" placeholder="Mathematics, English..." />
              </Form.Item>
              <Form.Item name="qualifications" label="Qualifications">
                <Select mode="tags" placeholder="Diplomas, experience..." />
              </Form.Item>
              <Form.Item name="bio" label="Short presentation">
                <Input.TextArea rows={3} maxLength={500} showCount />
              </Form.Item>
            </>
          )}
          <Button type="primary" htmlType="submit" loading={saving}>
            Create account
          </Button>
        </Form>
      </Card>
    </div>
  );
}

export default function NewUserPage() {
  return (
    <Suspense>
      <NewUserForm />
    </Suspense>
  );
}
