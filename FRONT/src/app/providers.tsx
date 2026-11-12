'use client';

import { App, ConfigProvider } from 'antd';
import enGB from 'antd/locale/en_GB';
import { SessionProvider, signOut, useSession } from 'next-auth/react';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { SWRConfig, useSWRConfig } from 'swr';
import { setAccessToken, setUnauthorizedHandler } from '@/lib/api';

/** Keeps the axios client and the SWR cache in sync with the NextAuth session. */
function AuthSync({ children }: { children: ReactNode }) {
  const { data, status } = useSession();
  const { mutate } = useSWRConfig();
  const userId = status === 'loading' ? undefined : (data?.user?.id ?? null);
  const previousUserId = useRef(userId);

  // Set during render so the first requests of a page already carry the token.
  setAccessToken(data?.accessToken);

  // Same URLs (e.g. /stats) return different data per user: never show the
  // previous account's cached responses after a logout or a new login.
  useEffect(() => {
    if (userId === undefined) return;
    const previous = previousUserId.current;
    previousUserId.current = userId;
    if (previous === undefined || previous === userId) return;
    // Drop every cached response; mounted pages refetch with the new token.
    mutate(() => true, undefined, { revalidate: true });
  }, [userId, mutate]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAccessToken(undefined);
      signOut({ callbackUrl: '/login?expired=1' });
    });
  }, []);

  return <>{children}</>;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ConfigProvider
        locale={enGB}
        theme={{
          token: {
            colorPrimary: '#4f46e5',
            borderRadius: 8,
            fontFamily:
              'var(--font-sans), -apple-system, Segoe UI, Roboto, sans-serif',
          },
        }}
      >
        <App>
          <SWRConfig
            value={{ revalidateOnFocus: false, shouldRetryOnError: false }}
          >
            <AuthSync>{children}</AuthSync>
          </SWRConfig>
        </App>
      </ConfigProvider>
    </SessionProvider>
  );
}
