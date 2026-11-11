import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/** Skips the global JWT and roles guards. Only login, refresh and the health check use it. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
