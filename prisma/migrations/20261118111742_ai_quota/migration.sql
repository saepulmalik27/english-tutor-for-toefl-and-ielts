-- CreateTable
CREATE TABLE "AiQuota" (
    "source" TEXT NOT NULL,
    "headers" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiQuota_pkey" PRIMARY KEY ("source")
);
