'use client';

import { Badge, Button, Card, Empty, Input, Spin } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MdArrowBack, MdSearch, MdSend } from 'react-icons/md';
import { PageHeader, RoleTag, UserAvatar } from '@/components/common/ui';
import { api } from '@/lib/api';
import { formatTime, fromNow } from '@/lib/format';
import { useApi, useCurrentUser, useNotify } from '@/lib/hooks';
import type { Contact, Message } from '@/types/models';

/**
 * One-to-one messaging between the actors allowed by the report
 * (admin ↔ mentor/teacher, mentor ↔ parent/teacher, teacher ↔ parent).
 * Opens a conversation directly with `?with=<userId>`.
 */
export default function ChatView() {
  const me = useCurrentUser();
  const router = useRouter();
  const params = useSearchParams();
  const notify = useNotify();
  const selectedId = params.get('with');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const {
    data: contacts,
    mutate: refreshContacts,
    isLoading,
  } = useApi<Contact[]>('/messages/contacts', {
    refreshInterval: 15_000,
  });
  const { data: thread, mutate: refreshThread } = useApi<Message[]>(
    selectedId ? `/messages/with/${selectedId}` : null,
    { refreshInterval: 5_000 }
  );

  const selected = contacts?.find((c) => c.user.id === selectedId);
  const filtered = useMemo(
    () =>
      (contacts ?? []).filter((c) =>
        `${c.user.name} ${c.user.email}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [contacts, search]
  );

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.length, selectedId]);

  // Opening a conversation marks it as read: refresh the unread counters.
  useEffect(() => {
    if (selectedId) refreshContacts();
  }, [selectedId, refreshContacts]);

  const open = (id: string | null) =>
    router.replace(id ? `?with=${id}` : '?', { scroll: false });

  const send = async () => {
    const content = draft.trim();
    if (!content || !selectedId) return;
    setSending(true);
    try {
      const { data } = await api.post<Message>('/messages', {
        receiver: selectedId,
        content,
      });
      setDraft('');
      await refreshThread([...(thread ?? []), data], false);
      refreshContacts();
    } catch (e) {
      notify.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle="Talk with the people who follow your children’s education."
      />
      <Card styles={{ body: { padding: 0 } }} className="overflow-hidden">
        <div className="grid h-[calc(100vh-190px)] min-h-[480px] md:grid-cols-[300px_1fr]">
          {/* Contacts */}
          <div
            className={`flex min-h-0 flex-col border-0 border-r border-solid border-gray-100 ${selectedId ? 'hidden md:flex' : 'flex'}`}
          >
            <div className="p-3">
              <Input
                prefix={<MdSearch />}
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {isLoading && (
                <div className="p-6 text-center">
                  <Spin />
                </div>
              )}
              {contacts && !filtered.length && (
                <Empty className="mt-10" description="No contacts yet" />
              )}
              {filtered.map((c) => (
                <button
                  key={c.user.id}
                  type="button"
                  onClick={() => open(c.user.id)}
                  className={`flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-3 py-3 text-left hover:bg-gray-50 ${
                    c.user.id === selectedId ? 'bg-brand-light' : ''
                  }`}
                >
                  <Badge count={c.unread} size="small">
                    <UserAvatar name={c.user.name} />
                  </Badge>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">
                        {c.user.name}
                      </span>
                      {c.lastMessage && (
                        <span className="shrink-0 text-xs text-gray-400">
                          {fromNow(c.lastMessage.createdAt)}
                        </span>
                      )}
                    </span>
                    <span
                      className={`block truncate text-xs ${c.unread ? 'font-semibold text-gray-800' : 'text-gray-500'}`}
                    >
                      {c.lastMessage
                        ? `${c.lastMessage.mine ? 'You: ' : ''}${c.lastMessage.content}`
                        : 'Start a conversation'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Conversation */}
          <div
            className={`min-h-0 flex-col ${selectedId ? 'flex' : 'hidden md:flex'}`}
          >
            {!selectedId || !selected ? (
              <div className="flex flex-1 items-center justify-center">
                <Empty
                  description={
                    selectedId && contacts
                      ? 'You cannot message this user'
                      : 'Select a conversation'
                  }
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 border-0 border-b border-solid border-gray-100 px-4 py-3">
                  <Button
                    className="md:hidden"
                    type="text"
                    icon={<MdArrowBack />}
                    onClick={() => open(null)}
                  />
                  <UserAvatar name={selected.user.name} />
                  <div>
                    <div className="font-semibold">{selected.user.name}</div>
                    <RoleTag role={selected.user.role} />
                  </div>
                </div>
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-gray-50 p-4">
                  {!thread && (
                    <div className="text-center">
                      <Spin />
                    </div>
                  )}
                  {thread?.length === 0 && (
                    <Empty description="No messages yet — say hello!" />
                  )}
                  {thread?.map((m) => {
                    const mine = m.sender === me?.id;
                    return (
                      <div
                        key={m._id}
                        className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${mine ? 'bg-brand text-white' : 'bg-white'}`}
                        >
                          <div className="whitespace-pre-wrap break-words text-sm">
                            {m.content}
                          </div>
                          <div
                            className={`mt-1 text-right text-[10px] ${mine ? 'text-indigo-100' : 'text-gray-400'}`}
                          >
                            {formatTime(m.createdAt)}
                            {mine && m.readAt ? ' · seen' : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottom} />
                </div>
                <div className="flex gap-2 border-0 border-t border-solid border-gray-100 p-3">
                  <Input.TextArea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type your message… (Enter to send)"
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    maxLength={2000}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<MdSend />}
                    loading={sending}
                    onClick={send}
                    disabled={!draft.trim()}
                  >
                    Send
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
