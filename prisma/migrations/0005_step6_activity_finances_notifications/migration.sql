-- Step 6: Activity feed, Notifications, My Finances, Categories, Promotional Banners

-- Activity / Audit log
CREATE TABLE "activity" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "activity_userId_idx" ON "activity"("userId");
ALTER TABLE "activity" ADD CONSTRAINT "activity_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Notifications
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Device tokens (for push notifications)
CREATE TABLE "device_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Income (My Finances)
CREATE TABLE "income" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "income_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "income_userId_idx" ON "income"("userId");
ALTER TABLE "income" ADD CONSTRAINT "income_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Personal expenses (My Finances)
CREATE TABLE "personal_expenses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "personal_expenses_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "personal_expenses_userId_idx" ON "personal_expenses"("userId");
ALTER TABLE "personal_expenses" ADD CONSTRAINT "personal_expenses_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Categories
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" UUID,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- Promotional Banners
CREATE TABLE "promotional_banners" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "image" TEXT,
    "cta" TEXT,
    "destination" TEXT,
    "targetScreen" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    CONSTRAINT "promotional_banners_pkey" PRIMARY KEY ("id")
);
