ALTER TABLE "User" ADD COLUMN "notificationEmailEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "notificationProductEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "notificationBillingEnabled" BOOLEAN NOT NULL DEFAULT true;
