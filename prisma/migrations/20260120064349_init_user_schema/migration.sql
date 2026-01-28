-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dob" DATE NOT NULL,
    "pinHash" TEXT NOT NULL,
    "gender" TEXT,
    "incomeRange" INTEGER,
    "occupation" TEXT,
    "permanentAddress" TEXT,
    "correspondenceAddress" TEXT,
    "profileImage" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");
