import { AntdRegistry } from '@ant-design/nextjs-registry';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import Providers from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: 'Faceatutor – Find the perfect tutor for your child',
    template: '%s · Faceatutor',
  },
  description:
    'Faceatutor connects parents with expert tutors and mentors: personalised courses, quizzes, calendar and progress tracking.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
