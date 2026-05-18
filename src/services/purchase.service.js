'use strict';

const Joi = require('joi');
const { validate: isUuid } = require('uuid');

const prisma = require('../config/prisma');
const { createAppError } = require('../utils/errors');

const resellerPurchaseSchema = Joi.object({
  reseller_price: Joi.number().min(0).required(),
});

async function resellerPurchase(productId, body) {
  if (!isUuid(productId)) throw createAppError('PRODUCT_NOT_FOUND', 'Product not found');

  const { error, value } = resellerPurchaseSchema.validate(body);
  if (error) throw createAppError('VALIDATION_ERROR', error.details[0].message);

  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`
      SELECT id, minimum_sell_price, is_sold, value, value_type
      FROM coupons
      WHERE id = ${productId}::uuid
      FOR UPDATE
    `;

    if (!rows.length) throw createAppError('PRODUCT_NOT_FOUND', 'Product not found');
    const coupon = rows[0];

    if (coupon.is_sold) throw createAppError('PRODUCT_ALREADY_SOLD', 'Product already sold');
    if (value.reseller_price < Number(coupon.minimum_sell_price)) {
      throw createAppError('RESELLER_PRICE_TOO_LOW', 'Reseller price is below minimum sell price');
    }

    await tx.coupon.update({ where: { id: productId }, data: { is_sold: true } });

    return {
      product_id: productId,
      final_price: Number(coupon.minimum_sell_price),
      value_type: coupon.value_type,
      value: coupon.value,
    };
  });
}

async function directPurchase(productId) {
  if (!isUuid(productId)) throw createAppError('PRODUCT_NOT_FOUND', 'Product not found');

  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw`
      SELECT id, minimum_sell_price, is_sold, value, value_type
      FROM coupons
      WHERE id = ${productId}::uuid
      FOR UPDATE
    `;

    if (!rows.length) throw createAppError('PRODUCT_NOT_FOUND', 'Product not found');
    const coupon = rows[0];

    if (coupon.is_sold) throw createAppError('PRODUCT_ALREADY_SOLD', 'Product already sold');

    await tx.coupon.update({ where: { id: productId }, data: { is_sold: true } });

    return {
      product_id: productId,
      final_price: Number(coupon.minimum_sell_price),
      value_type: coupon.value_type,
      value: coupon.value,
    };
  });
}

module.exports = { resellerPurchase, directPurchase };
