/*
  Warnings:

  - You are about to drop the column `config` on the `FormField` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `FormField` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[formId,order]` on the table `FormField` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "FormField_formId_position_key";

-- AlterTable
ALTER TABLE "FormField" DROP COLUMN "config",
DROP COLUMN "position",
ADD COLUMN     "options" JSONB,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "placeholder" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FormField_formId_order_key" ON "FormField"("formId", "order");
