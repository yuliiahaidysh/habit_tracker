import { Router, type Request, type Response, type NextFunction } from "express";
import { passport, findOrCreateUser } from "./passport.js";
import { env, googleConfigured, githubConfigured } from "./env.js";

export const authRouter = Router();

// Lets the frontend know which SSO buttons to enable.
authRouter.get("/providers", (_req, res) => {
  res.json({ google: googleConfigured, github: githubConfigured });
});

function mountProvider(name: "google" | "github", configured: boolean, scope: string[]) {
  if (!configured) {
    // Provider not set up — respond clearly instead of throwing "Unknown strategy".
    authRouter.get(`/${name}`, (_req, res) =>
      res.status(503).json({ error: `${name} OAuth is not configured on this server` }),
    );
    return;
  }

  authRouter.get(`/${name}`, passport.authenticate(name, { scope }));

  authRouter.get(
    `/${name}/callback`,
    passport.authenticate(name, {
      failureRedirect: `${env.clientUrl}/login?error=${name}`,
    }),
    (_req, res) => {
      // Success: session cookie is set — bounce back to the SPA.
      res.redirect(env.clientUrl);
    },
  );
}

mountProvider("google", googleConfigured, ["profile", "email"]);
mountProvider("github", githubConfigured, ["user:email"]);

// Test-only login: bypasses OAuth so automated tests never hit Google/GitHub.
// Mounted only when AUTH_TEST_MODE=1.
if (env.authTestMode) {
  authRouter.post("/test-login", async (req: Request, res: Response, next: NextFunction) => {
    const {
      provider = "test",
      providerUserId,
      displayName = "Test User",
      email = null,
      avatarUrl = null,
    } = req.body ?? {};
    if (!providerUserId) {
      res.status(400).json({ error: "providerUserId is required" });
      return;
    }
    try {
      const user = await findOrCreateUser({ provider, providerUserId, email, displayName, avatarUrl });
      req.login(user, (err) => (err ? next(err) : res.json(user)));
    } catch (err) {
      next(err);
    }
  });
}

authRouter.post("/logout", (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) {
      next(err);
      return;
    }
    req.session.destroy(() => {
      res.clearCookie("habit.sid");
      res.json({ ok: true });
    });
  });
});
