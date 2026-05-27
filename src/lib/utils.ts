import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Remove sensitive fields from a user document before sending in an API response.
 * Always use this before returning any User object to the client.
 */
export function sanitizeUser<T extends { passwordHash?: unknown }>(
  user: T
): Omit<T, 'passwordHash'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _ph, ...safe } = user;
  return safe;
}
