-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('COUPON');

-- CreateEnum
CREATE TYPE "ValueType" AS ENUM ('STRING', 'IMAGE');

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ProductType" NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
    "cost_price" DECIMAL(10,2) NOT NULL,
    "margin_percentage" DECIMAL(5,2) NOT NULL,
    "minimum_sell_price" DECIMAL(10,2) NOT NULL,
    "value_type" "ValueType" NOT NULL,
    "value" TEXT NOT NULL,
    "is_sold" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_id_fkey" FOREIGN KEY ("id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
