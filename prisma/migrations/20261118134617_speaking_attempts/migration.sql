-- CreateTable
CREATE TABLE "SpeakingAttempt" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "words" JSONB NOT NULL,
    "metrics" JSONB NOT NULL,
    "scores" JSONB NOT NULL,
    "feedback" JSONB NOT NULL,
    "band" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpeakingAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpeakingAttempt_createdAt_idx" ON "SpeakingAttempt"("createdAt");

-- AddForeignKey
ALTER TABLE "SpeakingAttempt" ADD CONSTRAINT "SpeakingAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
