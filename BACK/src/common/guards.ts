import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ALLOW_INACTIVE_KEY, IS_PUBLIC_KEY, ROLES_KEY } from './decorators';
import { Role } from './enums';
import { AuthUser } from './auth-user';

const isPublic = (reflector: Reflector, context: ExecutionContext) =>
  reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);

/** Every route requires a valid JWT unless decorated with @Public(). */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (isPublic(this.reflector, context)) return true;
    return super.canActivate(context);
  }
}

/** Enforces @Roles() and blocks pending accounts outside @AllowInactive() routes. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (isPublic(this.reflector, context)) return true;

    const user: AuthUser = context.switchToHttp().getRequest().user;
    const targets = [context.getHandler(), context.getClass()];

    const allowInactive = this.reflector.getAllAndOverride<boolean>(ALLOW_INACTIVE_KEY, targets);
    if (!user.accountStatus && !allowInactive) {
      throw new ForbiddenException('Your account is pending activation');
    }

    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, targets);
    if (roles?.length && !roles.includes(user.role)) {
      throw new ForbiddenException('You are not allowed to do this');
    }
    return true;
  }
}
