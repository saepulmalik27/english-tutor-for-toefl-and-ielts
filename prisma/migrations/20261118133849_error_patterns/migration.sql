/*
  Warnings:

  - You are about to drop the `UserMemory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserMemory" DROP CONSTRAINT "UserMemory_userId_fkey";

-- DropTable
DROP TABLE "UserMemory";

-- CreateTable
CREATE TABLE "PatternCard" (
    "patternId" TEXT NOT NULL,
    "card" JSONB NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatternCard_pkey" PRIMARY KEY ("patternId")
);

-- CreateTable
CREATE TABLE "PatternEvent" (
    "id" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "note" TEXT,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatternEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PatternCard_dueAt_idx" ON "PatternCard"("dueAt");

-- CreateIndex
CREATE INDEX "PatternEvent_createdAt_idx" ON "PatternEvent"("createdAt");

-- CreateIndex
CREATE INDEX "PatternEvent_patternId_idx" ON "PatternEvent"("patternId");
