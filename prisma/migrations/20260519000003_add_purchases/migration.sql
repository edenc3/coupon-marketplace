-- CreateTable
CREATE TABLE "purchases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coupon_id" UUID NOT NULL,
    "reseller_id" UUID NOT NULL,
    "final_price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (one purchase per coupon)
CREATE UNIQUE INDEX "purchases_coupon_id_key" ON "purchases"("coupon_id");

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id");

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_reseller_id_fkey" FOREIGN KEY ("reseller_id") REFERENCES "resellers"("id");
