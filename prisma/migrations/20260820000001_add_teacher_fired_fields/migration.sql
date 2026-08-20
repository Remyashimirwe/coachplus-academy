-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "isFired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "firedAt" TIMESTAMP(3),
ADD COLUMN     "fireMessage" TEXT;