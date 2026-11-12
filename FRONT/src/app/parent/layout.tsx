import type { ReactNode } from 'react';
import AppShell from '@/components/layout/AppShell';

export default function ParentLayout({ children }: { children: ReactNode }) {
  return <AppShell space="parent">{children}</AppShell>;
}
