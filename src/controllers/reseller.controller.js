const productService = require('../services/product.service');
const purchaseService = require('../services/purchase.service');
const { asyncHandler } = require('../utils/errors');

const listProducts = asyncHandler(async (req, res) => {
  const products = await productService.getAllProductsPublic();
  res.json(products);
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductByIdPublic(req.params.id);
  res.json(product);
});

const purchaseProduct = asyncHandler(async (req, res) => {
  const result = await purchaseService.resellerPurchase(req.params.id, req.body, req.reseller.id);
  res.json(result);
});

const purchaseDirect = asyncHandler(async (req, res) => {
  const result = await purchaseService.directPurchase(req.params.id);
  res.json(result);
});

module.exports = { listProducts, getProduct, purchaseProduct, purchaseDirect };
