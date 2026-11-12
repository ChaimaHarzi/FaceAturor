'use client';

import { Button, Result, Spin } from 'antd';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { api, getErrorMessage } from '@/lib/api';

function VerifyEmail() {
  const token = useSearchParams().get('token');
  const [state, setState] = useState<{ ok: boolean; message: string }>();
  const sent = useRef(false);

  useEffect(() => {
    // Guard against React strict-mode double effects: the token works only once.
    if (!token || sent.current) return;
    sent.current = true;
    api
      .post<{ message: string }>('/auth/verify-email', { token })
      .then(({ data }) => setState({ ok: true, message: data.message }))
      .catch((e) => setState({ ok: false, message: getErrorMessage(e) }));
  }, [token]);

  if (!token)
    return (
      <Result
        status="warning"
        title="Invalid link"
        subTitle="This verification link is incomplete."
      />
    );
  if (!state) {
    return (
      <div className="py-16 text-center">
        <Spin size="large" />
        <p className="mt-4 text-gray-500">Verifying your email…</p>
      </div>
    );
  }
  return (
    <Result
      status={state.ok ? 'success' : 'error'}
      title={state.ok ? 'Email verified' : 'Verification failed'}
      subTitle={state.message}
      extra={
        <Link href="/login">
          <Button type="primary">Sign in</Button>
        </Link>
      }
    />
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}
