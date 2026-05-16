'use strict';

const Joi = require('joi');
const { validate: isUuid } = require('uuid');

const repo = require('../repositories/product.repository');
const { calculateMinimumSellPrice } = require('../utils/pricing');
const { createAppError } = require('../utils/errors');

const createCouponSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  image_url: Joi.string().uri().required(),
  cost_price: Joi.number().min(0).required(),
  margin_percentage: Joi.number().min(0).required(),
  value_type: Joi.string().valid('STRING', 'IMAGE').required(),
  value: Joi.string().required(),
});

const updateCouponSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string().allow('', null),
  image_url: Joi.string().uri(),
  cost_price: Joi.number().min(0),
  margin_percentage: Joi.number().min(0),
  value_type: Joi.string().valid('STRING', 'IMAGE'),
  value: Joi.string(),
}).min(1);

function assertValidId(id) {
  if (!isUuid(id)) throw createAppError('PRODUCT_NOT_FOUND', 'Product not found');
}

async function createCoupon(body) {
  const { error, value } = createCouponSchema.validate(body);
  if (error) throw createAppError('VALIDATION_ERROR', error.details[0].message);

  const minimum_sell_price = calculateMinimumSellPrice(value.cost_price, value.margin_percentage);

  return repo.createProduct({ ...value, minimum_sell_price });
}

async function updateCoupon(id, body) {
  assertValidId(id);

  const { error, value } = updateCouponSchema.validate(body);
  if (error) throw createAppError('VALIDATION_ERROR', error.details[0].message);

  const existing = await repo.findByIdAdmin(id);
  if (!existing) throw createAppError('PRODUCT_NOT_FOUND', 'Product not found');

  const { cost_price, margin_percentage, ...rest } = value;
  const update = { ...rest };

  if (cost_price !== undefined || margin_percentage !== undefined) {
    const newCost = cost_price !== undefined ? cost_price : Number(existing.coupon.cost_price);
    const newMargin =
      margin_percentage !== undefined ? margin_percentage : Number(existing.coupon.margin_percentage);
    update.cost_price = newCost;
    update.margin_percentage = newMargin;
    update.minimum_sell_price = calculateMinimumSellPrice(newCost, newMargin);
  }

  return repo.updateProduct(id, update);
}

async function getAllProductsAdmin() {
  return repo.findAllAdmin();
}

async function getProductByIdAdmin(id) {
  assertValidId(id);
  const product = await repo.findByIdAdmin(id);
  if (!product) throw createAppError('PRODUCT_NOT_FOUND', 'Product not found');
  return product;
}

async function deleteProduct(id) {
  assertValidId(id);
  const existing = await repo.findByIdAdmin(id);
  if (!existing) throw createAppError('PRODUCT_NOT_FOUND', 'Product not found');
  return repo.deleteProduct(id);
}

async function getAllProductsPublic() {
  return repo.findAllPublic();
}

async function getProductByIdPublic(id) {
  assertValidId(id);
  const product = await repo.findByIdPublic(id);
  if (!product) throw createAppError('PRODUCT_NOT_FOUND', 'Product not found');
  return product;
}

module.exports = {
  createCoupon,
  updateCoupon,
  getAllProductsAdmin,
  getProductByIdAdmin,
  deleteProduct,
  getAllProductsPublic,
  getProductByIdPublic,
};
