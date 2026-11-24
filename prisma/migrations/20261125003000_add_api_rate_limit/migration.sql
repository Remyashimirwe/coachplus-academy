CREATE TABLE "ApiRateLimit" (
    "keyHash" VARCHAR(64) NOT NULL,
    "windowStart" TIMESTAMPTZ(6) NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "ApiRateLimit_pkey" PRIMARY KEY ("keyHash", "windowStart")
);

CREATE INDEX "ApiRateLimit_windowStart_idx" ON "ApiRateLimit"("windowStart");
