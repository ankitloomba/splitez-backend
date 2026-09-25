-- CreateTable
CREATE TABLE "enquiries" (
    "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
    "userId"      UUID,
    "name"        TEXT         NOT NULL,
    "email"       TEXT         NOT NULL,
    "phone"       TEXT,
    "topic"       TEXT         NOT NULL,
    "message"     TEXT         NOT NULL,
    "attachments" JSONB        NOT NULL DEFAULT '[]',
    "status"      TEXT         NOT NULL DEFAULT 'open',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "enquiries_status_createdAt_idx" ON "enquiries"("status", "createdAt");
