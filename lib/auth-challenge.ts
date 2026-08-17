import crypto from "node:crypto";

export function createOpaqueChallengeToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  return { rawToken, tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex") };
}

export function hashChallengeToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
