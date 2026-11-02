/*
  Warnings:

  - A unique constraint covering the columns `[directKey]` on the table `rooms` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('DIRECT', 'GROUP');

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "directKey" TEXT,
ADD COLUMN     "type" "RoomType" NOT NULL DEFAULT 'GROUP',
ALTER COLUMN "name" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "room_members_roomId_idx" ON "room_members"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_directKey_key" ON "rooms"("directKey");
