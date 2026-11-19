-- DropForeignKey
ALTER TABLE "DailyMetric" DROP CONSTRAINT "DailyMetric_userId_fkey";

-- DropForeignKey
ALTER TABLE "GeneratedLesson" DROP CONSTRAINT "GeneratedLesson_userId_fkey";

-- DropForeignKey
ALTER TABLE "Journal" DROP CONSTRAINT "Journal_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "currentIeltsBand",
DROP COLUMN "currentToeflScore",
DROP COLUMN "lastActive",
DROP COLUMN "streak",
DROP COLUMN "targetIeltsBand",
DROP COLUMN "targetToeflScore";

-- DropTable
DROP TABLE "DailyMetric";

-- DropTable
DROP TABLE "GeneratedLesson";

-- DropTable
DROP TABLE "Journal";

-- DropTable
DROP TABLE "Lesson";

