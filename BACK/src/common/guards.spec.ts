import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_INACTIVE_KEY, IS_PUBLIC_KEY, ROLES_KEY } from './decorators';
import { Role } from './enums';
import { RolesGuard } from './guards';

const context = (user: object) =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as any;

const reflectorWith = (metadata: Record<string, unknown>) =>
  ({ getAllAndOverride: (key: string) => metadata[key] }) as unknown as Reflector;

describe('RolesGuard', () => {
  const teacher = { id: '1', role: Role.TEACHER, accountStatus: true };

  it('lets public routes through', () => {
    const guard = new RolesGuard(reflectorWith({ [IS_PUBLIC_KEY]: true }));
    expect(guard.canActivate(context({}))).toBe(true);
  });

  it('allows a user whose role is listed', () => {
    const guard = new RolesGuard(reflectorWith({ [ROLES_KEY]: [Role.TEACHER, Role.ADMIN] }));
    expect(guard.canActivate(context(teacher))).toBe(true);
  });

  it('forbids a user whose role is not listed', () => {
    const guard = new RolesGuard(reflectorWith({ [ROLES_KEY]: [Role.ADMIN] }));
    expect(() => guard.canActivate(context(teacher))).toThrow(ForbiddenException);
  });

  it('blocks pending accounts except on @AllowInactive routes', () => {
    const pending = { id: '2', role: Role.PARENT, accountStatus: false };
    expect(() => new RolesGuard(reflectorWith({})).canActivate(context(pending))).toThrow(
      /pending/,
    );
    expect(
      new RolesGuard(reflectorWith({ [ALLOW_INACTIVE_KEY]: true })).canActivate(context(pending)),
    ).toBe(true);
  });
});
