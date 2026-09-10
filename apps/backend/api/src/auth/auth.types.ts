export interface AuthenticatedUser {
  provider: 'google';
  providerUserId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}
