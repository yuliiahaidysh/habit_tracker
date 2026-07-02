/**
 * OAuth Provider Mock Interfaces
 *
 * These interfaces define the contract for mocking Google and GitHub OAuth providers.
 * All tests use these mocks to avoid real network calls and OAuth state management.
 * The backend's /auth/test-login endpoint implements the union of these interfaces.
 */

/**
 * Unified OAuth provider profile that both Google and GitHub map to.
 * Used in tests to create user records without real OAuth handshakes.
 */
export interface MockOAuthProfile {
  provider: 'google' | 'github' | 'test';
  providerUserId: string;
  email?: string | null;
  displayName?: string;
  avatarUrl?: string | null;
}

/**
 * Google OAuth mock profile.
 * Simulates a Google OAuth2 response from google-passport strategy.
 * Google always returns email if user authorized it; may return displayName from profile.
 */
export interface MockGoogleProfile extends MockOAuthProfile {
  provider: 'google';
  email?: string; // Google typically provides email unless user denied
}

/**
 * GitHub OAuth mock profile.
 * Simulates a GitHub OAuth2 response from passport-github2 strategy.
 * GitHub email is optional and depends on user account settings.
 * displayName comes from the GitHub profile's name field.
 */
export interface MockGitHubProfile extends MockOAuthProfile {
  provider: 'github';
  email?: string | null; // GitHub email may be null if not public or user didn't authorize
}

/**
 * Test login request payload.
 * Sent to POST /auth/test-login to simulate successful OAuth.
 * Only available when AUTH_TEST_MODE=1 (never in production).
 */
export interface TestLoginRequest {
  provider?: 'google' | 'github' | 'test';
  providerUserId: string;
  email?: string | null;
  displayName?: string;
  avatarUrl?: string | null;
}

/**
 * User response from /auth/test-login or /api/me.
 * Confirms user record was created or session exists.
 */
export interface TestLoginResponse {
  id: string;
  provider: string;
  providerUserId: string;
  email?: string | null;
  displayName: string;
  avatarUrl?: string | null;
}

/**
 * Factory for creating test profiles matching real OAuth responses.
 */
export const createMockProfiles = {
  /**
   * Google user who provided email (most common case).
   */
  googleWithEmail: (overrides?: Partial<MockGoogleProfile>): MockGoogleProfile => ({
    provider: 'google',
    providerUserId: 'g-' + Math.random().toString(36).slice(2),
    email: 'user@gmail.com',
    displayName: 'Test User',
    ...overrides,
  }),

  /**
   * GitHub user who provided email.
   */
  githubWithEmail: (overrides?: Partial<MockGitHubProfile>): MockGitHubProfile => ({
    provider: 'github',
    providerUserId: 'gh-' + Math.random().toString(36).slice(2),
    email: 'user@github.com',
    displayName: 'Test User',
    ...overrides,
  }),

  /**
   * GitHub user with no email (privacy-conscious; common edge case).
   */
  githubNoEmail: (overrides?: Partial<MockGitHubProfile>): MockGitHubProfile => ({
    provider: 'github',
    providerUserId: 'gh-' + Math.random().toString(36).slice(2),
    email: null,
    displayName: 'Private User',
    ...overrides,
  }),

  /**
   * Minimal valid profile (only required fields).
   */
  minimal: (provider: 'google' | 'github' = 'google', overrides?: Partial<MockOAuthProfile>): MockOAuthProfile => ({
    provider,
    providerUserId: `${provider}-${Math.random().toString(36).slice(2)}`,
    displayName: 'User',
    ...overrides,
  }),
};
