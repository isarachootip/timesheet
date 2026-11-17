import type { User } from '../types';

export interface BootstrapQueryFlags {
  enableUsersQuery: boolean;
  enableWorkspaceQueries: boolean;
}

export const isLocalDemoHostname = (hostname: string): boolean => {
  const normalized = hostname.trim().toLowerCase();
  return normalized === 'localhost' || normalized === '127.0.0.1';
};

export const resolveBootstrapQueryFlags = (
  currentUser: User | null,
  hostname: string
): BootstrapQueryFlags => {
  const isAuthenticated = Boolean(currentUser);
  return {
    enableUsersQuery: isAuthenticated || isLocalDemoHostname(hostname),
    enableWorkspaceQueries: isAuthenticated,
  };
};
