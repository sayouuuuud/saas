-- Add a default role so existing staff accounts remain fully operational.
ALTER TABLE "User" ADD COLUMN "staffRole" TEXT NOT NULL DEFAULT 'ADMIN';
