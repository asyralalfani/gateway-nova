-- AlterTable
ALTER TABLE "Tool" ADD COLUMN     "checkedAt" TIMESTAMP(3),
ADD COLUMN     "responseMs" INTEGER,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "statusCode" INTEGER;
