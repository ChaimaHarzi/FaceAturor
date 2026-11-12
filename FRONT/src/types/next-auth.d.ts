import type { DefaultSession } from 'next-auth';
import type { Role } from '@/lib/roles';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  accountStatus: boolean;
}

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    user: SessionUser & DefaultSession['user'];
  }

  interface User extends SessionUser {
    accessToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    user: SessionUser;
  }
}
