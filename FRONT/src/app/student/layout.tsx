'use client';

import { Button, Spin } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { MdArrowBack } from 'react-icons/md';
import { UserAvatar } from '@/components/common/ui';
import AppShell from '@/components/layout/AppShell';
import { useStudentStore } from '@/lib/student-store';

/**
 * Student space: opened by the parent for one child (report: "access to the
 * application is exclusively through parent login credentials").
 */
export default function StudentLayout({ children }: { children: ReactNode }) {
  const { childId, childName } = useStudentStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (hydrated && !childId) router.replace('/parent/children');
  }, [hydrated, childId, router]);

  if (!hydrated || !childId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const header = (
    <div className="rounded-2xl bg-navy-light p-3">
      <div className="flex items-center gap-2">
        <UserAvatar name={childName} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">
            {childName}
          </div>
          <div className="text-xs text-gray-400">Student space</div>
        </div>
      </div>
      <Link href="/parent/children">
        <Button size="small" block className="mt-3" icon={<MdArrowBack />}>
          Parent space
        </Button>
      </Link>
    </div>
  );

  return (
    <AppShell space="student" header={header}>
      {children}
    </AppShell>
  );
}
