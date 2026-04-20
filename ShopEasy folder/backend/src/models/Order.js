const mongoose = require('mongoose');

const ORDER_STATUSES = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ['Cash On Delivery', 'Card', 'UPI'],
      default: 'Cash On Delivery',
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'Pending',
    },
  },
  { timestamps: true }
);

orderSchema.statics.ORDER_STATUSES = ORDER_STATUSES;

module.exports = mongoose.model('Order', orderSchema);
