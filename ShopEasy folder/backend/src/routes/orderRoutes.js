const express = require('express');
const { createOrder, getMyOrders } = require('../controllers/orderController');
const protect = require('../middlewares/auth');

const router = express.Router();

router.use(protect);
router.get('/', getMyOrders);
router.post('/', createOrder);

module.exports = router;
