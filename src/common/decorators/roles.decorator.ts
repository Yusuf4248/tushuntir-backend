import { SetMetadata } from "@nestjs/common";
import { UserRole } from "../enums";

export const ROLES_KEY = "roles";

/** Roles allowed on a controller or route. Routes without @Roles or @Public are rejected. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
