import { UserRole } from "../enums";

/** The authenticated user, attached to the request by JwtAuthGuard. */
export interface AuthUser {
  id: number;
  role: UserRole;
  schoolId: number | null;
}
