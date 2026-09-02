-- Analytics events
CREATE TABLE "analytics_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID,
    "sessionId" TEXT,
    "event" TEXT NOT NULL,
    "screen" TEXT,
    "action" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "platform" TEXT,
    "appVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "analytics_events_userId_idx" ON "analytics_events"("userId");
CREATE INDEX "analytics_events_event_idx" ON "analytics_events"("event");
CREATE INDEX "analytics_events_createdAt_idx" ON "analytics_events"("createdAt");
CREATE INDEX "analytics_events_sessionId_idx" ON "analytics_events"("sessionId");

-- Service health logs
CREATE TABLE "service_health_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "statusCode" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "error" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_health_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "service_health_logs_endpoint_createdAt_idx" ON "service_health_logs"("endpoint", "createdAt");
CREATE INDEX "service_health_logs_statusCode_idx" ON "service_health_logs"("statusCode");
CREATE INDEX "service_health_logs_createdAt_idx" ON "service_health_logs"("createdAt");
