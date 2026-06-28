export const env = {
  authEnabled: process.env.AUTH_ENABLED === "true",
  authSecret: process.env.AUTH_SECRET ?? "",
  nextAuthUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  pingEnabled: process.env.PING_ENABLED !== "false",
  pingSecret: process.env.PING_SECRET ?? "",
  pingTimeoutMs: Number(process.env.PING_TIMEOUT_MS ?? 5000),
};
