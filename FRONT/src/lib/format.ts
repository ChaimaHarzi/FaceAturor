import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { ChildRef } from '@/types/models';

dayjs.extend(relativeTime);

export const formatDate = (value?: string | Date | null) =>
  value ? dayjs(value).format('DD MMM YYYY') : '—';

export const formatDateTime = (value?: string | Date | null) =>
  value ? dayjs(value).format('DD MMM YYYY, HH:mm') : '—';

export const formatTime = (value?: string | Date | null) =>
  value ? dayjs(value).format('HH:mm') : '';

export const fromNow = (value?: string | Date | null) =>
  value ? dayjs(value).fromNow() : '';

export const formatMoney = (amount?: number | null) =>
  `${(amount ?? 0).toLocaleString('fr-TN', { maximumFractionDigits: 3 })} TND`;

export const childName = (child?: Partial<ChildRef> | null) =>
  child ? `${child.firstName ?? ''} ${child.lastName ?? ''}`.trim() : '—';

export const initials = (name?: string) =>
  (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const ageFrom = (dateOfBirth?: string) =>
  dateOfBirth ? `${dayjs().diff(dayjs(dateOfBirth), 'year')} y` : '—';
