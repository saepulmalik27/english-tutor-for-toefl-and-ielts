-- AlterEnum
ALTER TYPE "ContentKind" ADD VALUE 'drill';

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "patternId" TEXT;

-- CreateIndex
CREATE INDEX "Question_patternId_idx" ON "Question"("patternId");
