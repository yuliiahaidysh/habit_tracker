import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import type { Profile as GoogleProfile } from "passport-google-oauth20";
import type { Profile as GitHubProfile } from "passport-github2";
import { prisma } from "./db.js";
import { env, googleConfigured, githubConfigured } from "./env.js";

interface UpsertInput {
  provider: string;
  providerUserId: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
}

/**
 * Look up a user by (provider, providerUserId) and create one on first sign-in.
 * Identity is keyed on the provider id, never email — GitHub may not return an email,
 * and the same person on Google vs GitHub is intentionally two separate accounts.
 */
export async function findOrCreateUser(input: UpsertInput) {
  return prisma.user.upsert({
    where: {
      provider_providerUserId: {
        provider: input.provider,
        providerUserId: input.providerUserId,
      },
    },
    update: {
      email: input.email,
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
    },
    create: input,
  });
}

// Store only the user id in the session; rehydrate the full record on each request.
passport.serializeUser((user, done) => {
  done(null, (user as Express.User).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user ?? false);
  } catch (err) {
    done(err as Error);
  }
});

if (googleConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.google.clientId,
        clientSecret: env.google.clientSecret,
        callbackURL: `${env.serverUrl}/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile: GoogleProfile, done) => {
        try {
          const user = await findOrCreateUser({
            provider: "google",
            providerUserId: profile.id,
            email: profile.emails?.[0]?.value ?? null,
            displayName: profile.displayName || profile.username || "Google User",
            avatarUrl: profile.photos?.[0]?.value ?? null,
          });
          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      },
    ),
  );
}

if (githubConfigured) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.github.clientId,
        clientSecret: env.github.clientSecret,
        callbackURL: `${env.serverUrl}/auth/github/callback`,
        scope: ["user:email"],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: GitHubProfile,
        done: (err: Error | null, user?: Express.User | false) => void,
      ) => {
        try {
          const user = await findOrCreateUser({
            provider: "github",
            providerUserId: String(profile.id),
            email: profile.emails?.[0]?.value ?? null,
            displayName: profile.displayName || profile.username || "GitHub User",
            avatarUrl: profile.photos?.[0]?.value ?? null,
          });
          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      },
    ),
  );
}

export { passport };
