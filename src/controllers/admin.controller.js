const service = require('../services/product.service');
const resellerService = require('../services/reseller.service');
const { sendError } = require('../utils/errors');

async function listProducts(req, res) {
  try {
    const products = await service.getAllProductsAdmin();
    res.json(products);
  } catch (err) {
    sendError(res, err);
  }
}

async function getProduct(req, res) {
  try {
    const product = await service.getProductByIdAdmin(req.params.id);
    res.json(product);
  } catch (err) {
    sendError(res, err);
  }
}

async function createProduct(req, res) {
  try {
    const product = await service.createCoupon(req.body);
    res.status(201).json(product);
  } catch (err) {
    sendError(res, err);
  }
}

async function updateProduct(req, res) {
  try {
    const product = await service.updateCoupon(req.params.id, req.body);
    res.json(product);
  } catch (err) {
    sendError(res, err);
  }
}

async function deleteProduct(req, res) {
  try {
    await service.deleteProductAdmin(req.params.id);
    res.status(204).send();
  } catch (err) {
    sendError(res, err);
  }
}

async function createReseller(req, res) {
  try {
    const reseller = await resellerService.createReseller(req.body);
    res.status(201).json(reseller);
  } catch (err) {
    sendError(res, err);
  }
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct, createReseller };
