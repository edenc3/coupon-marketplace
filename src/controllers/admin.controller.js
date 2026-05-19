const service = require('../services/product.service');
const resellerService = require('../services/reseller.service');
const { asyncHandler } = require('../utils/errors');

const listProducts = asyncHandler(async (req, res) => {
  const products = await service.getAllProductsAdmin();
  res.json(products);
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await service.getProductByIdAdmin(req.params.id);
  res.json(product);
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await service.createCoupon(req.body);
  res.status(201).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await service.updateCoupon(req.params.id, req.body);
  res.json(product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  await service.deleteProductAdmin(req.params.id);
  res.status(204).send();
});

const createReseller = asyncHandler(async (req, res) => {
  const reseller = await resellerService.createReseller(req.body);
  res.status(201).json(reseller);
});

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct, createReseller };
