-- AlterTable: Add imageUrls column
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update existing orders to new status values
UPDATE "orders" SET status = 'agent_sudlaj_bn' WHERE status = 'pending';
UPDATE "orders" SET status = 'tolbor_huleej_bn' WHERE status = 'approved';
UPDATE "orders" SET status = 'tsutsalsan_zahialga' WHERE status = 'rejected';
UPDATE "orders" SET status = 'amjilttai_zahialga' WHERE status = 'completed';

-- Drop old enum and create new one
DROP TYPE IF EXISTS "OrderStatus" CASCADE;
CREATE TYPE "OrderStatus" AS ENUM ('agent_sudlaj_bn', 'tolbor_huleej_bn', 'amjilttai_zahialga', 'tsutsalsan_zahialga');

-- Alter column to use new enum
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus" USING status::text::"OrderStatus";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'agent_sudlaj_bn';

