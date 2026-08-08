/*
  Warnings:

  - You are about to drop the column `correspondenceAddress` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `dob` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `incomeRange` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isBanned` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `occupation` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `permanentAddress` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `pinHash` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "correspondenceAddress",
DROP COLUMN "dob",
DROP COLUMN "fullName",
DROP COLUMN "gender",
DROP COLUMN "incomeRange",
DROP COLUMN "isActive",
DROP COLUMN "isBanned",
DROP COLUMN "occupation",
DROP COLUMN "permanentAddress",
DROP COLUMN "pinHash",
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ALTER COLUMN "mobile" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
