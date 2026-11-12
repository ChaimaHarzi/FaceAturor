'use client';

import { Alert, Button, Form, Input, Result } from 'antd';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { api, getErrorMessage } from '@/lib/api';

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function ResetPasswordForm() {
  const token = useSearchParams().get('token');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <Result
        status="warning"
        title="Invalid link"
        subTitle="This reset link is incomplete."
        extra={
          <Link href="/forgot-password">
            <Button>Ask for a new link</Button>
          </Link>
        }
      />
    );
  }

  if (done) {
    return (
      <Result
        status="success"
        title="Password updated"
        extra={
          <Link href="/login">
            <Button type="primary">Sign in</Button>
          </Link>
        }
      />
    );
  }

  const onFinish = async ({ password }: { password: string }) => {
    setLoading(true);
    setError(undefined);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-navy">
        Choose a new password
      </h1>
      {error && (
        <Alert className="mb-4" type="error" showIcon message={error} />
      )}
      <Form
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        size="large"
      >
        <Form.Item
          name="password"
          label="New password"
          rules={[
            {
              required: true,
              pattern: PASSWORD_RULE,
              message: '8+ characters with letters and numbers',
            },
          ]}
        >
          <Input.Password autoComplete="new-password" autoFocus />
        </Form.Item>
        <Form.Item
          name="confirm"
          label="Confirm password"
          dependencies={['password']}
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                !value || value === getFieldValue('password')
                  ? Promise.resolve()
                  : Promise.reject(new Error('Passwords do not match')),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          Update password
        </Button>
      </Form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
