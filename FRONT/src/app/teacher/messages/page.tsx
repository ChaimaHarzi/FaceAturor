'use client';

import { Suspense } from 'react';
import ChatView from '@/components/messages/ChatView';

export default function MessagesPage() {
  return (
    <Suspense>
      <ChatView />
    </Suspense>
  );
}
