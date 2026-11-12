import { Role } from './enums';

/** Shape of `request.user` once the JWT has been validated. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  accountStatus: boolean;
}
