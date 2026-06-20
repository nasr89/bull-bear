-- CreateEnum
CREATE TYPE "PlaybookCategory" AS ENUM ('FOLLOWUP_SCRIPT', 'WHATSAPP_MESSAGE', 'OBJECTION', 'PRO_TIP');

-- CreateTable
CREATE TABLE "playbook_items" (
    "id" TEXT NOT NULL,
    "category" "PlaybookCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tag" TEXT,
    "tagColor" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playbook_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "playbook_items_category_sortOrder_idx" ON "playbook_items"("category", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "playbook_items_category_title_key" ON "playbook_items"("category", "title");
