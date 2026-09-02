-- Dashboard elements (CMS)
CREATE TABLE "dashboard_elements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "body" TEXT,
    "image" TEXT,
    "cta" TEXT,
    "destination" TEXT,
    "targetScreen" TEXT NOT NULL DEFAULT 'home',
    "position" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL DEFAULT '{}',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "dashboard_elements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "dashboard_elements_targetScreen_status_idx" ON "dashboard_elements"("targetScreen", "status");
