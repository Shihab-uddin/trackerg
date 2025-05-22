/*
  Warnings:

  - A unique constraint covering the columns `[userId,projectId]` on the table `ProjectMember` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `project` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX `ProjectMember_userId_projectId_key` ON `ProjectMember`(`userId`, `projectId`);
