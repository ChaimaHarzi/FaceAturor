'use client';

import { Avatar, Card, Rate, Tag } from 'antd';
import type { ReactNode } from 'react';
import { initials } from '@/lib/format';
import { Gender, Role, roleColors, roleLabels } from '@/lib/roles';
import type { Rating } from '@/types/models';

export function PageHeader({
  title,
  subtitle,
  extra,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {extra && (
        <div className="flex flex-wrap items-center gap-2">{extra}</div>
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  color = '#4f46e5',
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  color?: string;
}) {
  return (
    <Card className="h-full" styles={{ body: { padding: 20 } }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-3xl font-semibold text-navy">{value}</div>
          <div className="mt-1 text-sm text-gray-500">{label}</div>
          {hint && <div className="mt-2 text-xs text-gray-400">{hint}</div>}
        </div>
        {icon && (
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
            style={{ background: `${color}1a`, color }}
          >
            {icon}
          </span>
        )}
      </div>
    </Card>
  );
}

const avatarColors = [
  '#4f46e5',
  '#ec4899',
  '#0891b2',
  '#f59e0b',
  '#10b981',
  '#8b5cf6',
];

export function UserAvatar({
  name,
  size = 'default',
}: {
  name?: string;
  size?: 'small' | 'default' | 'large' | number;
}) {
  const color = avatarColors[(name ?? '').length % avatarColors.length];
  return (
    <Avatar size={size} style={{ background: color, flexShrink: 0 }}>
      {initials(name)}
    </Avatar>
  );
}

export function UserCell({ name, email }: { name?: string; email?: string }) {
  return (
    <div className="flex items-center gap-3">
      <UserAvatar name={name} />
      <div className="min-w-0">
        <div className="truncate font-medium">{name ?? '—'}</div>
        {email && <div className="truncate text-xs text-gray-500">{email}</div>}
      </div>
    </div>
  );
}

export const RoleTag = ({ role }: { role: Role }) => (
  <Tag color={roleColors[role]}>{roleLabels[role]}</Tag>
);

export const GenderTag = ({ gender }: { gender?: Gender }) =>
  gender ? (
    <Tag color={gender === Gender.FEMALE ? 'pink' : 'geekblue'}>
      {gender === Gender.FEMALE ? 'Female' : 'Male'}
    </Tag>
  ) : (
    <>—</>
  );

export function RatingDisplay({ rating }: { rating?: Rating }) {
  if (!rating?.count || rating.average === null)
    return <span className="text-xs text-gray-400">No rating yet</span>;
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <Rate
        disabled
        allowHalf
        value={rating.average}
        style={{ fontSize: 13 }}
      />
      <span className="text-xs text-gray-500">
        {rating.average} ({rating.count})
      </span>
    </span>
  );
}

export const TagList = ({
  items,
  color,
}: {
  items?: string[];
  color?: string;
}) =>
  items?.length ? (
    <span className="flex flex-wrap gap-1">
      {items.map((item) => (
        <Tag key={item} color={color} className="m-0">
          {item}
        </Tag>
      ))}
    </span>
  ) : (
    <span className="text-gray-400">—</span>
  );
