import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const file of [".env.local", ".env"]) {
    const candidate = path.join(root, file);
    if (!fs.existsSync(candidate)) continue;
    const line = fs.readFileSync(candidate, "utf8").split(/\r?\n/).find((entry) => /^\s*DATABASE_URL\s*=/.test(entry));
    if (line) return line.replace(/^\s*DATABASE_URL\s*=\s*/, "").trim().replace(/^['"]|['"]$/g, "");
  }
  return "";
}

const databaseUrl = readDatabaseUrl();
const schema = /^(postgres|postgresql):\/\//.test(databaseUrl)
  ? "prisma/postgresql/schema.prisma"
  : /^file:|^sqlite:/.test(databaseUrl)
    ? "prisma/schema.prisma"
    : null;

if (!schema) {
  console.error("DATABASE_URL must use postgresql://, postgres://, file:, or sqlite: before Prisma client generation.");
  process.exit(1);
}

console.log(`Generating Prisma client from ${schema} for ${databaseUrl.replace(/:\/\/.*@/, "://***@")}`);
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
execFileSync(pnpm, ["exec", "prisma", "generate", "--schema", schema], {
  cwd: root,
  env: { ...process.env, DATABASE_URL: databaseUrl },
  stdio: "inherit",
});
