import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-[url('/bgHeero.jpg')] bg-cover bg-center lg:block">
        <div className="flex h-full flex-col justify-end bg-gradient-to-t from-navy via-navy/70 to-navy/20 p-12">
          <h2 className="text-3xl font-semibold text-white">
            Learning, personalised.
          </h2>
          <p className="mt-3 max-w-md text-gray-200">
            A mentor, expert teachers and a clear view of your child’s progress.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-white px-4 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Faceatutor logo"
              width={40}
              height={40}
            />
            <span className="text-xl font-semibold text-navy">Faceatutor</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
