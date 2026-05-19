const Joi = require('joi');
const { validate: isUuid } = require('uuid');

const prisma = require('../config/prisma');
const { createAppError } = require('../utils/errors');

const resellerPurchaseSchema = Joi.object({
  reseller_price: Joi.number().min(0).required(),
});

async function resellerPurchase(productId, body, resellerId) {
  if (!isUuid(productId)) throw createAppError('PRODUCT_NOT_FOUND', 'Product not found');

  const { error, value } = resellerPurchaseSchema.validate(body);
  if (error) throw createAppError('VALIDATION_ERROR', error.details[0].message);

  const coupon = await prisma.coupon.findUnique({
    where: { id: productId },
    select: { minimum_sell_price: true, is_sold: true, value: true, value_type: true },
  });

  if (!coupon) throw createAppError('PRODUCT_NOT_FOUND', 'Product not found');
  if (coupon.is_sold) throw createAppError('PRODUCT_ALREADY_SOLD', 'Product already sold');
  if (value.reseller_price < Number(coupon.minimum_sell_price)) {
    throw createAppError('RESELLER_PRICE_TOO_LOW', 'Reseller price is below minimum sell price');
  }

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.coupon.updateMany({
      where: { id: productId, is_sold: false },
      data: { is_sold: true },
    });

    if (count === 0) throw createAppError('PRODUCT_ALREADY_SOLD', 'Product already sold');

    await tx.purchase.create({
      data: { coupon_id: productId, reseller_id: resellerId, final_price: value.reseller_price },
    });
  });

  return {
    product_id: productId,
    final_price: value.reseller_price,
    value_type: coupon.value_type,
    value: coupon.value,
  };
}

async function directPurchase(productId) {
  if (!isUuid(productId)) throw createAppError('PRODUCT_NOT_FOUND', 'Product not found');

  const coupon = await prisma.coupon.findUnique({
    where: { id: productId },
    select: { minimum_sell_price: true, is_sold: true, value: true, value_type: true },
  });

  if (!coupon) throw createAppError('PRODUCT_NOT_FOUND', 'Product not found');
  if (coupon.is_sold) throw createAppError('PRODUCT_ALREADY_SOLD', 'Product already sold');

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.coupon.updateMany({
      where: { id: productId, is_sold: false },
      data: { is_sold: true },
    });

    if (count === 0) throw createAppError('PRODUCT_ALREADY_SOLD', 'Product already sold');

    await tx.purchase.create({
      data: { coupon_id: productId, reseller_id: null, final_price: Number(coupon.minimum_sell_price) },
    });
  });

  return {
    product_id: productId,
    final_price: Number(coupon.minimum_sell_price),
    value_type: coupon.value_type,
    value: coupon.value,
  };
}

module.exports = { resellerPurchase, directPurchase };
