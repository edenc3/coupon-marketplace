const { Router } = require('express');
const ctrl = require('../controllers/reseller.controller');
const { resellerAuth } = require('../middleware/auth.middleware');
const { idempotency } = require('../middleware/idempotency.middleware');

const router = Router();

router.get('/products', ctrl.listProducts);
router.get('/products/:id', ctrl.getProduct);
router.post('/products/:id/purchase', resellerAuth, idempotency, ctrl.purchaseProduct);
router.post('/products/:id/purchase/direct', ctrl.purchaseDirect);

module.exports = router;
