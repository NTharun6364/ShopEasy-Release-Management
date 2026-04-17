const express = require('express');
const {
  getAllOrders,
  updateOrderStatus,
  getDashboardSummary,
} = require('../controllers/adminController');
const protect = require('../middlewares/auth');
const adminOnly = require('../middlewares/admin');

const router = express.Router();

router.use(protect, adminOnly);
router.get('/dashboard', getDashboardSummary);
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);

module.exports = router;
