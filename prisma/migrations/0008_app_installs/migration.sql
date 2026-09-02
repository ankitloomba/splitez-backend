-- App installs tracking
CREATE TABLE "app_installs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "installId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "appVersion" TEXT,
    "osVersion" TEXT,
    "deviceModel" TEXT,
    "userId" UUID,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalled" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "app_installs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "app_installs_installId_key" ON "app_installs"("installId");
CREATE INDEX "app_installs_platform_idx" ON "app_installs"("platform");
CREATE INDEX "app_installs_firstSeen_idx" ON "app_installs"("firstSeen");
CREATE INDEX "app_installs_lastSeen_idx" ON "app_installs"("lastSeen");

-- Ad placements (server-driven ad config)
CREATE TABLE "ad_placements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "adType" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'all',
    "screen" TEXT NOT NULL,
    "position" TEXT NOT NULL DEFAULT 'bottom',
    "adUnitIos" TEXT,
    "adUnitAndroid" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "adFreeSkip" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ad_placements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ad_placements_name_key" ON "ad_placements"("name");
CREATE INDEX "ad_placements_screen_enabled_idx" ON "ad_placements"("screen", "enabled");

-- Seed default ad placements
INSERT INTO "ad_placements" ("id", "name", "adType", "platform", "screen", "position", "adUnitIos", "adUnitAndroid", "enabled", "frequency", "adFreeSkip", "updatedAt")
VALUES
  (gen_random_uuid(), 'home_banner', 'banner', 'all', 'home', 'bottom', 'ca-app-pub-XXXXX/home-ios', 'ca-app-pub-XXXXX/home-android', true, 1, true, NOW()),
  (gen_random_uuid(), 'groups_banner', 'banner', 'all', 'groups', 'bottom', 'ca-app-pub-XXXXX/groups-ios', 'ca-app-pub-XXXXX/groups-android', true, 1, true, NOW()),
  (gen_random_uuid(), 'expense_list_native', 'native', 'all', 'expenses', 'after_item', 'ca-app-pub-XXXXX/expense-native-ios', 'ca-app-pub-XXXXX/expense-native-android', true, 5, true, NOW()),
  (gen_random_uuid(), 'settlement_interstitial', 'interstitial', 'all', 'settlements', 'inline', 'ca-app-pub-XXXXX/settle-ios', 'ca-app-pub-XXXXX/settle-android', true, 3, true, NOW()),
  (gen_random_uuid(), 'finances_banner', 'banner', 'all', 'finances', 'bottom', 'ca-app-pub-XXXXX/finance-ios', 'ca-app-pub-XXXXX/finance-android', true, 1, true, NOW());
