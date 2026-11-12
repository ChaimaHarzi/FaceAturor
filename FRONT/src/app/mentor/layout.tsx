import type { ReactNode } from 'react';
import AppShell from '@/components/layout/AppShell';

export default function MentorLayout({ children }: { children: ReactNode }) {
  return <AppShell space="mentor">{children}</AppShell>;
}
