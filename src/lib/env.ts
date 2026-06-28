export const env = {
  authEnabled: process.env.AUTH_ENABLED === "true",
  authSecret: process.env.AUTH_SECRET ?? "",
  nextAuthUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
};
