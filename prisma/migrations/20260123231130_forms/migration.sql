-- AlterTable
ALTER TABLE "Form" ALTER COLUMN "slug" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FormField" ALTER COLUMN "position" SET DEFAULT 0;
