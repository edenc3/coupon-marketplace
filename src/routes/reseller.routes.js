'use strict';

const { Router } = require('express');
const ctrl = require('../controllers/reseller.controller');
const { resellerAuth } = require('../middleware/auth.middleware');

const router = Router();

router.get('/products', ctrl.listProducts);
router.get('/products/:id', ctrl.getProduct);
router.post('/products/:id/purchase', resellerAuth, ctrl.purchaseProduct);

module.exports = router;
