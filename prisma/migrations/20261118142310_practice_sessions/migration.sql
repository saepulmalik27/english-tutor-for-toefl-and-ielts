-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "plan" JSONB NOT NULL,
    "step" INTEGER NOT NULL DEFAULT 0,
    "results" JSONB NOT NULL DEFAULT '{}',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PracticeSession_day_key" ON "PracticeSession"("day");
