'use client';

import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Skeleton,
} from 'antd';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { MdDeleteOutline, MdEdit, MdLockOutline } from 'react-icons/md';
import {
  GenderTag,
  PageHeader,
  RoleTag,
  TagList,
  UserAvatar,
} from '@/components/common/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useApi, useNotify } from '@/lib/hooks';
import { Gender, Role } from '@/lib/roles';
import type { User } from '@/types/models';

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function ProfileView() {
  const { data: user, mutate, isLoading } = useApi<User>('/users/me');
  const { update } = useSession();
  const router = useRouter();
  const notify = useNotify();
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  if (isLoading || !user) return <Skeleton active avatar />;
  const isTeacher = user.role === Role.TEACHER;

  const save = async (values: Partial<User>) => {
    setSaving(true);
    try {
      await mutate((await api.patch<User>('/users/me', values)).data, false);
      await update(); // refresh the name/email shown in the menu
      notify.message.success('Profile updated');
      setEditing(false);
    } catch (e) {
      notify.error(e);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (values: {
    currentPassword: string;
    newPassword: string;
  }) => {
    setSaving(true);
    try {
      await api.patch('/auth/password', values);
      notify.message.success('Password updated');
      passwordForm.resetFields();
      setChangingPassword(false);
    } catch (e) {
      notify.error(e);
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = () =>
    notify.confirmDelete(
      'Delete my account?',
      async () => {
        await api.delete('/users/me');
        await signOut({ redirect: false });
        router.replace('/');
      },
      'Your account, your children’s profiles and their results will be permanently deleted.'
    );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Account details" />
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <UserAvatar name={user.name} size={72} />
          <div className="flex-1">
            <div className="text-xl font-semibold">{user.name}</div>
            <div className="text-gray-500">{user.email}</div>
            <div className="mt-2">
              <RoleTag role={user.role} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              icon={<MdEdit />}
              type="primary"
              onClick={() => {
                form.setFieldsValue(user);
                setEditing(true);
              }}
            >
              Update
            </Button>
            <Button
              icon={<MdLockOutline />}
              onClick={() => setChangingPassword(true)}
            >
              Password
            </Button>
            {user.role === Role.PARENT && (
              <Button icon={<MdDeleteOutline />} danger onClick={deleteAccount}>
                Delete account
              </Button>
            )}
          </div>
        </div>

        <Descriptions
          className="mt-6"
          column={{ xs: 1, sm: 2 }}
          bordered
          size="middle"
        >
          <Descriptions.Item label="Phone">
            {user.phone || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Gender">
            <GenderTag gender={user.gender} />
          </Descriptions.Item>
          <Descriptions.Item label="Member since">
            {formatDate(user.createdAt)}
          </Descriptions.Item>
          {user.role === Role.PARENT && (
            <Descriptions.Item label="Mentor">
              {user.mentor?.name ?? 'Not assigned yet'}
            </Descriptions.Item>
          )}
          {isTeacher && (
            <>
              <Descriptions.Item label="Expertise" span={2}>
                <TagList items={user.expertise} color="blue" />
              </Descriptions.Item>
              <Descriptions.Item label="Qualifications" span={2}>
                <TagList items={user.qualifications} />
              </Descriptions.Item>
              <Descriptions.Item label="About" span={2}>
                {user.bio || '—'}
              </Descriptions.Item>
            </>
          )}
        </Descriptions>
      </Card>

      <Modal
        title="Update profile"
        open={editing}
        onCancel={() => setEditing(false)}
        onOk={form.submit}
        confirmLoading={saving}
        okText="Save"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={save} preserve={false}>
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
          {isTeacher && (
            <>
              <Form.Item name="expertise" label="Expertise (subjects)">
                <Select mode="tags" placeholder="Mathematics, English..." />
              </Form.Item>
              <Form.Item name="qualifications" label="Qualifications">
                <Select mode="tags" placeholder="Diplomas, experience..." />
              </Form.Item>
              <Form.Item name="bio" label="About me">
                <Input.TextArea rows={3} maxLength={500} showCount />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      <Modal
        title="Change password"
        open={changingPassword}
        onCancel={() => setChangingPassword(false)}
        onOk={passwordForm.submit}
        confirmLoading={saving}
        okText="Update"
      >
        <Form form={passwordForm} layout="vertical" onFinish={changePassword}>
          <Form.Item
            name="currentPassword"
            label="Current password"
            rules={[{ required: true }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="New password"
            rules={[
              {
                required: true,
                pattern: PASSWORD_RULE,
                message: '8+ characters with letters and numbers',
              },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
