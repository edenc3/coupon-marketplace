-- AlterTable: allow direct purchases with no reseller
ALTER TABLE "purchases" ALTER COLUMN "reseller_id" DROP NOT NULL;
