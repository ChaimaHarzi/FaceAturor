export enum Role {
  SUPER_ADMIN = 1,
  ADMIN = 2,
  MENTOR = 3,
  PARENT = 4,
  TEACHER = 5,
}

export enum Gender {
  MALE = 1,
  FEMALE = 2,
}

export const roleLabels: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'Super Admin',
  [Role.ADMIN]: 'Admin',
  [Role.MENTOR]: 'Mentor',
  [Role.PARENT]: 'Parent',
  [Role.TEACHER]: 'Teacher',
};

export const roleColors: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'magenta',
  [Role.ADMIN]: 'purple',
  [Role.MENTOR]: 'cyan',
  [Role.PARENT]: 'gold',
  [Role.TEACHER]: 'blue',
};

export const genderLabel = (gender?: Gender) =>
  gender === Gender.FEMALE ? 'Female' : gender === Gender.MALE ? 'Male' : '—';

export const isAdminRole = (role?: Role) =>
  role === Role.SUPER_ADMIN || role === Role.ADMIN;

/** Landing page of each space after login. */
export const homeFor = (role?: Role, accountStatus = true): string => {
  if (role === Role.PARENT && !accountStatus) return '/pending';
  switch (role) {
    case Role.SUPER_ADMIN:
    case Role.ADMIN:
      return '/admin/dashboard';
    case Role.MENTOR:
      return '/mentor/dashboard';
    case Role.TEACHER:
      return '/teacher/dashboard';
    case Role.PARENT:
      return '/parent/children';
    default:
      return '/login';
  }
};

/** URL prefix → roles allowed in that space (used by the middleware). */
export const spaces: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: '/admin', roles: [Role.SUPER_ADMIN, Role.ADMIN] },
  { prefix: '/mentor', roles: [Role.MENTOR] },
  { prefix: '/teacher', roles: [Role.TEACHER] },
  { prefix: '/parent', roles: [Role.PARENT] },
  { prefix: '/student', roles: [Role.PARENT] },
];
