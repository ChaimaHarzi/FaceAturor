import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { homeFor, Role, spaces } from '@/lib/roles';

/**
 * Route protection (report: "access to specific modules requires login"):
 * unauthenticated users go to /login, users opening another role's space are
 * sent back to their own, and pending parents can only see /pending.
 */
export default withAuth(
  function middleware(req) {
    const user = req.nextauth.token?.user;
    if (!user) return NextResponse.next();

    const path = req.nextUrl.pathname;
    const home = homeFor(user.role, user.accountStatus);
    const redirect = (to: string) =>
      NextResponse.redirect(new URL(to, req.url));

    if (path === '/pending')
      return user.accountStatus ? redirect(home) : NextResponse.next();
    if (user.role === Role.PARENT && !user.accountStatus)
      return redirect('/pending');

    const space = spaces.find(
      (s) => path === s.prefix || path.startsWith(`${s.prefix}/`)
    );
    if (space && !space.roles.includes(user.role)) return redirect(home);
    return NextResponse.next();
  },
  { pages: { signIn: '/login' } }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/mentor/:path*',
    '/teacher/:path*',
    '/parent/:path*',
    '/student/:path*',
    '/pending',
  ],
};
