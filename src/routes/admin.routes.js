'use strict';

const { Router } = require('express');
const ctrl = require('../controllers/admin.controller');

const router = Router();

router.get('/products', ctrl.listProducts);
router.get('/products/:id', ctrl.getProduct);
router.post('/products', ctrl.createProduct);
router.patch('/products/:id', ctrl.updateProduct);
router.delete('/products/:id', ctrl.deleteProduct);

module.exports = router;
