import axios from 'axios';
import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { SessionUser } from '@/types/next-auth';
import type { User } from '@/types/models';
import { API_URL, getErrorMessage } from './api';

const toSessionUser = (user: User): SessionUser => ({
  id: user._id ?? user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  accountStatus: user.accountStatus !== false,
});

const SEVEN_DAYS = 7 * 24 * 60 * 60;

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: SEVEN_DAYS },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        try {
          const { data } = await axios.post<{
            accessToken: string;
            user: User;
          }>(`${API_URL}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });
          return { ...toSessionUser(data.user), accessToken: data.accessToken };
        } catch (error) {
          // The message is shown on the login page (wrong password, email not verified...).
          throw new Error(getErrorMessage(error, 'Unable to sign in'));
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.user = toSessionUser(user as unknown as User);
      }
      // `update()` from the client never trusts client data: reload from the API.
      if (trigger === 'update' && token.accessToken) {
        try {
          const { data } = await axios.get<User>(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token.accessToken}` },
          });
          token.user = toSessionUser(data);
        } catch {
          // keep the previous values; a 401 will sign the user out client-side
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user = token.user;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
