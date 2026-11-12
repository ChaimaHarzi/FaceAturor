'use client';

import { Avatar, Badge, Dropdown, Grid, Spin, Tooltip } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { type ReactNode, useEffect, useState } from 'react';
import {
  MdChevronLeft,
  MdChevronRight,
  MdLogout,
  MdOutlinePerson,
} from 'react-icons/md';
import { useApi } from '@/lib/hooks';
import { initials } from '@/lib/format';
import { navigation, profileHref, type Space } from '@/lib/navigation';
import { Role, roleLabels } from '@/lib/roles';
import { setAccessToken } from '@/lib/api';

const COLLAPSE_KEY = 'faceatutor-sidebar-collapsed';

interface Props {
  space: Space;
  children: ReactNode;
  /** Optional block shown above the navigation (e.g. the selected student). */
  header?: ReactNode;
}

export default function AppShell({ space, children, header }: Props) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const screens = Grid.useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COLLAPSE_KEY);
      setCollapsed(saved ? saved === '1' : window.innerWidth < 768);
    } catch {
      setCollapsed(window.innerWidth < 768);
    }
  }, []);

  const toggle = () => {
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, value ? '0' : '1');
      } catch {
        // storage unavailable (private mode): keep it in memory only
      }
      return !value;
    });
  };

  const user = session?.user;
  const { data: unread } = useApi<{ count: number }>(
    user && space !== 'student' ? '/messages/unread-count' : null,
    { refreshInterval: 30_000 }
  );

  if (status !== 'authenticated' || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const items = navigation[space].filter(
    (item) => !item.superAdminOnly || user.role === Role.SUPER_ADMIN
  );
  const narrow = collapsed || !screens.md;

  const logout = async () => {
    setAccessToken(undefined);
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <div className="flex min-h-screen">
      <aside
        className={`sticky top-3 m-3 flex h-[calc(100vh-24px)] shrink-0 flex-col justify-between rounded-3xl bg-navy py-4 shadow-lg transition-all duration-200 ${
          narrow ? 'w-[72px]' : 'w-[230px]'
        }`}
      >
        <div className="flex min-h-0 flex-col">
          <div
            className={`flex items-center gap-2 px-4 pb-3 ${narrow ? 'justify-center' : ''}`}
          >
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Faceatutor"
                width={32}
                height={32}
                className="rounded-full bg-white"
              />
              {!narrow && (
                <span className="text-lg font-semibold text-white">
                  Faceatutor
                </span>
              )}
            </Link>
          </div>

          {header && !narrow && <div className="px-3 pb-3">{header}</div>}

          <nav className="flex min-h-0 flex-col gap-1 overflow-y-auto px-3">
            {items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              const count = item.messages ? unread?.count ?? 0 : 0;
              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? 'bg-accent text-white'
                      : 'text-gray-400 hover:bg-navy-light hover:text-white'
                  } ${narrow ? 'justify-center' : ''}`}
                >
                  <Badge
                    count={narrow ? count : 0}
                    size="small"
                    offset={[2, -2]}
                  >
                    <Icon
                      size={20}
                      className={active ? 'text-white' : 'text-gray-400'}
                    />
                  </Badge>
                  {!narrow && <span className="flex-1">{item.label}</span>}
                  {!narrow && count > 0 && <Badge count={count} size="small" />}
                </Link>
              );
              return narrow ? (
                <Tooltip key={item.href} title={item.label} placement="right">
                  {link}
                </Tooltip>
              ) : (
                link
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-2 px-3">
          {screens.md && (
            <button
              type="button"
              onClick={toggle}
              aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
              className="flex cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent py-1 text-gray-400 hover:text-white"
            >
              {collapsed ? (
                <MdChevronRight size={22} />
              ) : (
                <MdChevronLeft size={22} />
              )}
            </button>
          )}
          <div className="border-0 border-t border-solid border-white/10 pt-3">
            <Dropdown
              placement="topLeft"
              trigger={['click']}
              menu={{
                items: [
                  {
                    key: 'profile',
                    icon: <MdOutlinePerson />,
                    label: (
                      <Link href={profileHref(space)}>Account details</Link>
                    ),
                  },
                  { type: 'divider' },
                  {
                    key: 'logout',
                    icon: <MdLogout />,
                    label: 'Sign out',
                    danger: true,
                    onClick: logout,
                  },
                ],
              }}
            >
              <button
                type="button"
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-transparent p-1 text-left hover:bg-navy-light ${
                  narrow ? 'justify-center' : ''
                }`}
              >
                <Avatar className="shrink-0 bg-accent">
                  {initials(user.name)}
                </Avatar>
                {!narrow && (
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {user.name}
                    </span>
                    <span className="block text-xs text-gray-400">
                      {roleLabels[user.role]}
                    </span>
                  </span>
                )}
              </button>
            </Dropdown>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-2 py-5 pr-4 md:px-4 md:pr-6">
        {children}
      </main>
    </div>
  );
}
