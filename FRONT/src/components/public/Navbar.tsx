'use client';

import { Button, Drawer } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { MdMenu } from 'react-icons/md';
import { homeFor } from '@/lib/roles';

const links = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#teachers', label: 'Teachers' },
  { href: '/#testimonials', label: 'Testimonials' },
];

export default function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const user = session?.user;

  const actions = user ? (
    <Link href={homeFor(user.role, user.accountStatus)}>
      <Button type="primary">My space</Button>
    </Link>
  ) : (
    <>
      <Link href="/login">
        <Button>Sign in</Button>
      </Link>
      <Link href="/register">
        <Button type="primary">Sign up</Button>
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-0 border-b border-solid border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Faceatutor logo" width={36} height={36} />
          <span className="text-lg font-semibold text-navy">Faceatutor</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">{actions}</div>
        <Button
          className="md:hidden"
          icon={<MdMenu />}
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        />
      </div>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Faceatutor"
        width={260}
      >
        <div className="flex flex-col gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2">{actions}</div>
        </div>
      </Drawer>
    </header>
  );
}
