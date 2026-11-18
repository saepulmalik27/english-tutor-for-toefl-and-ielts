/*
  Warnings:

  - You are about to drop the column `articleId` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `optionsJson` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `question` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the `Article` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GeneratedArticle` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GeneratedProgress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GeneratedQuestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserProgress` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `kind` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prompt` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContentKind" AS ENUM ('reading_s1', 'reading_s2', 'reading_s3', 'writing_t1', 'writing_t2', 'speaking_p1', 'speaking_p2', 'speaking_p3');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('active', 'retired');

-- DropForeignKey
ALTER TABLE "GeneratedArticle" DROP CONSTRAINT "GeneratedArticle_userId_fkey";

-- DropForeignKey
ALTER TABLE "GeneratedProgress" DROP CONSTRAINT "GeneratedProgress_articleId_fkey";

-- DropForeignKey
ALTER TABLE "GeneratedQuestion" DROP CONSTRAINT "GeneratedQuestion_articleId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_articleId_fkey";

-- DropForeignKey
ALTER TABLE "UserProgress" DROP CONSTRAINT "UserProgress_articleId_fkey";

-- DropForeignKey
ALTER TABLE "UserProgress" DROP CONSTRAINT "UserProgress_userId_fkey";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "articleId",
DROP COLUMN "optionsJson",
DROP COLUMN "question",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "kind" "ContentKind" NOT NULL,
ADD COLUMN     "options" JSONB,
ADD COLUMN     "passageId" TEXT,
ADD COLUMN     "prompt" TEXT NOT NULL,
ADD COLUMN     "status" "ContentStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "answer" DROP NOT NULL,
ALTER COLUMN "explanation" DROP NOT NULL;

-- DropTable
DROP TABLE "Article";

-- DropTable
DROP TABLE "GeneratedArticle";

-- DropTable
DROP TABLE "GeneratedProgress";

-- DropTable
DROP TABLE "GeneratedQuestion";

-- DropTable
DROP TABLE "UserProgress";

-- CreateTable
CREATE TABLE "Passage" (
    "id" TEXT NOT NULL,
    "kind" "ContentKind" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'active',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceUrl" TEXT,
    "license" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Passage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Passage_kind_status_idx" ON "Passage"("kind", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Passage_source_sourceId_key" ON "Passage"("source", "sourceId");

-- CreateIndex
CREATE INDEX "Question_kind_status_idx" ON "Question"("kind", "status");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "Passage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
