const { Router } = require('express');
const ctrl = require('../controllers/admin.controller');
const { adminAuth } = require('../middleware/auth.middleware');

const router = Router();

router.use(adminAuth);

router.get('/products', ctrl.listProducts);
router.get('/products/:id', ctrl.getProduct);
router.post('/products', ctrl.createProduct);
router.patch('/products/:id', ctrl.updateProduct);
router.delete('/products/:id', ctrl.deleteProduct);

router.post('/resellers', ctrl.createReseller);

module.exports = router;
