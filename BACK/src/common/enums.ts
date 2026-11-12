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

export const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN];

export const isAdmin = (role: Role) => ADMIN_ROLES.includes(role);

/** Accepts either the numeric value or the name ("teacher", "MENTOR"...). */
export const parseRole = (value: string | number): Role | undefined => {
  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    const n = Number(value);
    return Object.values(Role).includes(n) ? (n as Role) : undefined;
  }
  return Role[String(value).toUpperCase() as keyof typeof Role];
};
