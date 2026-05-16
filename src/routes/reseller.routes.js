'use strict';

const { Router } = require('express');
const ctrl = require('../controllers/reseller.controller');
const { resellerAuth } = require('../middleware/auth.middleware');

const router = Router();

router.use(resellerAuth);

router.get('/products', ctrl.listProducts);
router.get('/products/:id', ctrl.getProduct);
router.post('/products/:id/purchase', ctrl.purchaseProduct);

module.exports = router;
