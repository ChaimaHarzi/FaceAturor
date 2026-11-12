'use client';

import { Alert, Button, Form, Input } from 'antd';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, signIn } from 'next-auth/react';
import { Suspense, useState } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import { useNotify } from '@/lib/hooks';
import { homeFor } from '@/lib/roles';

interface LoginValues {
  email: string;
  password: string;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const notify = useNotify();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [unverifiedEmail, setUnverifiedEmail] = useState<string>();

  const onFinish = async ({ email, password }: LoginValues) => {
    setLoading(true);
    setError(undefined);
    setUnverifiedEmail(undefined);
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError(result.error);
      if (/verify/i.test(result.error)) setUnverifiedEmail(email);
      setLoading(false);
      return;
    }
    const session = await getSession();
    const callbackUrl = params.get('callbackUrl');
    const target = homeFor(session?.user.role, session?.user.accountStatus);
    router.replace(
      callbackUrl &&
        callbackUrl.startsWith('/') &&
        !callbackUrl.startsWith('//')
        ? callbackUrl
        : target
    );
    router.refresh();
  };

  const resend = async () => {
    try {
      const { data } = await api.post<{ message: string }>(
        '/auth/resend-verification',
        { email: unverifiedEmail }
      );
      notify.message.success(data.message);
    } catch (e) {
      notify.message.error(getErrorMessage(e));
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold text-navy">Welcome back</h1>
      <p className="mb-6 mt-1 text-gray-500">
        Sign in to your Faceatutor space.
      </p>

      {params.get('expired') && (
        <Alert
          className="mb-4"
          type="info"
          showIcon
          message="Your session has expired, please sign in again."
        />
      )}
      {error && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message={error}
          action={
            unverifiedEmail && (
              <Button size="small" onClick={resend}>
                Resend email
              </Button>
            )
          }
        />
      )}

      <Form<LoginValues>
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        size="large"
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, type: 'email', message: 'Enter a valid email' },
          ]}
        >
          <Input autoComplete="email" autoFocus />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: 'Enter your password' }]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <div className="-mt-2 mb-4 text-right">
          <Link href="/forgot-password" className="text-sm text-brand">
            Forgot password?
          </Link>
        </div>
        <Button type="primary" htmlType="submit" block loading={loading}>
          Sign in
        </Button>
      </Form>

      <p className="mt-6 text-center text-sm text-gray-500">
        New on Faceatutor?{' '}
        <Link href="/register" className="text-brand">
          Create a parent account
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
