import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Role } from './enums';
import { AuthUser } from './auth-user';

export const IS_PUBLIC_KEY = 'isPublic';
/** Route reachable without a token. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
/** Restricts a route to the given roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const ALLOW_INACTIVE_KEY = 'allowInactive';
/** Route reachable by a parent whose account is still pending activation. */
export const AllowInactive = () => SetMetadata(ALLOW_INACTIVE_KEY, true);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user,
);
