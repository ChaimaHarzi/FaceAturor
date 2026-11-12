'use client';

import { Alert, Button, Form, Input, Result } from 'antd';
import Link from 'next/link';
import { useState } from 'react';
import { api, getErrorMessage } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState<string>();

  const onFinish = async ({ email }: { email: string }) => {
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await api.post<{ message: string }>(
        '/auth/forgot-password',
        { email }
      );
      setSent(data.message);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Result
        status="info"
        title="Check your inbox"
        subTitle={`${sent} The link is valid for one hour.`}
        extra={
          <Link href="/login">
            <Button>Back to sign in</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-navy">
        Forgot your password?
      </h1>
      <p className="mb-6 mt-1 text-gray-500">
        Enter your email, we will send you a link to choose a new one.
      </p>
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
          name="email"
          label="Email"
          rules={[{ required: true, type: 'email' }]}
        >
          <Input autoComplete="email" autoFocus />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          Send reset link
        </Button>
      </Form>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-brand">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
