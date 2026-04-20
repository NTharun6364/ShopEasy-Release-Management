const Product = require('../models/Product');
const Order = require('../models/Order');

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch all orders' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const normalizedStatus = status === 'Processing' ? 'Pending' : status;

    if (!Order.ORDER_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        message: `Status must be one of: ${Order.ORDER_STATUSES.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = normalizedStatus;
    await order.save();

    const updatedOrder = await Order.findById(order._id).populate('user', 'name email');

    return res.status(200).json(updatedOrder);
  } catch (error) {
    return res.status(400).json({ message: 'Unable to update order status', error: error.message });
  }
};

const getDashboardSummary = async (req, res) => {
  try {
    const [productCount, orderCount, revenueResult, pendingOrders] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.countDocuments({ status: 'Pending' }),
    ]);

    return res.status(200).json({
      productCount,
      orderCount,
      pendingOrders,
      totalRevenue: revenueResult[0]?.total || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch dashboard summary' });
  }
};

module.exports = { getAllOrders, updateOrderStatus, getDashboardSummary };
