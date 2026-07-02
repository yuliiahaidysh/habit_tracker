// Augments Passport's Express.User with our persisted user shape so req.user is typed.
declare global {
  namespace Express {
    interface User {
      id: string;
      provider: string;
      providerUserId: string;
      email: string | null;
      displayName: string;
      avatarUrl: string | null;
    }
  }
}

export {};
