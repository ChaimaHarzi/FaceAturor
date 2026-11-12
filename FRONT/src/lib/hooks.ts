'use client';

import { App } from 'antd';
import { useSession } from 'next-auth/react';
import useSWR, { type SWRConfiguration } from 'swr';
import { fetcher, getErrorMessage } from './api';

/** GET an API resource with caching; pass null to skip the request. */
export function useApi<T>(url: string | null, options?: SWRConfiguration<T>) {
  return useSWR<T>(url, fetcher, options);
}

export function useCurrentUser() {
  return useSession().data?.user;
}

/** antd message/modal bound to the app context, plus an error helper. */
export function useNotify() {
  const { message, modal } = App.useApp();
  return {
    message,
    modal,
    error: (error: unknown, fallback?: string) =>
      message.error(getErrorMessage(error, fallback)),
    /** Confirmation dialog for destructive actions. */
    confirmDelete: (
      title: string,
      onOk: () => Promise<unknown>,
      content?: string
    ) =>
      modal.confirm({
        title,
        content: content ?? 'This action cannot be undone.',
        okText: 'Delete',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await onOk();
          } catch (error) {
            message.error(getErrorMessage(error));
          }
        },
      }),
  };
}
