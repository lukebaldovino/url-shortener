-- CreateTable
CREATE TABLE "Url" (
    "shortCode" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Url_pkey" PRIMARY KEY ("shortCode")
);

-- CreateIndex
CREATE INDEX "Url_expiresAt_idx" ON "Url"("expiresAt");
