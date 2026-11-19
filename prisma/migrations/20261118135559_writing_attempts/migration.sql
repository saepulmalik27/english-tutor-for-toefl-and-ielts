-- CreateTable
CREATE TABLE "WritingAttempt" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "scores" JSONB NOT NULL,
    "feedback" JSONB NOT NULL,
    "band" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WritingAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WritingAttempt_createdAt_idx" ON "WritingAttempt"("createdAt");

-- AddForeignKey
ALTER TABLE "WritingAttempt" ADD CONSTRAINT "WritingAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
