'use client';

import { Button, Card, Result } from 'antd';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { useNotify } from '@/lib/hooks';
import { homeFor } from '@/lib/roles';

/** Parents land here until an admin activates them after the mentor meeting. */
export default function PendingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const notify = useNotify();
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    const refreshed = await update();
    setChecking(false);
    if (refreshed?.user.accountStatus) {
      router.replace(homeFor(refreshed.user.role, true));
      router.refresh();
    } else {
      notify.message.info('Your account is still pending activation.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-lg">
        <Result
          status="info"
          title={`Welcome ${session?.user.name ?? ''}!`}
          subTitle="Your account is waiting for activation. An admin will schedule a video meeting with a mentor during the period you selected; you will receive the link by email. Your account is activated right after this first meeting."
          extra={[
            <Button
              key="check"
              type="primary"
              loading={checking}
              onClick={check}
            >
              Check my status
            </Button>,
            <Button key="logout" onClick={() => signOut({ callbackUrl: '/' })}>
              Sign out
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
}
