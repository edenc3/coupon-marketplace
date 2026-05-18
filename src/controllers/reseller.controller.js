'use strict';

const productService = require('../services/product.service');
const purchaseService = require('../services/purchase.service');
const { sendError } = require('../utils/errors');

async function listProducts(req, res) {
  try {
    const products = await productService.getAllProductsPublic();
    res.json(products);
  } catch (err) {
    sendError(res, err);
  }
}

async function getProduct(req, res) {
  try {
    const product = await productService.getProductByIdPublic(req.params.id);
    res.json(product);
  } catch (err) {
    sendError(res, err);
  }
}

async function purchaseProduct(req, res) {
  try {
    const result = await purchaseService.resellerPurchase(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
}

async function purchaseDirect(req, res) {
  try {
    const result = await purchaseService.directPurchase(req.params.id);
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
}

module.exports = { listProducts, getProduct, purchaseProduct, purchaseDirect };
