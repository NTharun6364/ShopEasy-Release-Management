const Cart = require('../models/Cart');
const Product = require('../models/Product');

const normalizeCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.product');

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await cart.populate('items.product');
  }

  return cart;
};

const getCart = async (req, res) => {
  try {
    const cart = await normalizeCart(req.user._id);
    return res.status(200).json(cart);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch cart' });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const cart = await normalizeCart(req.user._id);
    const existingItem = cart.items.find((item) => item.product._id.toString() === productId);

    if (existingItem) {
      existingItem.quantity += Number(quantity);
    } else {
      cart.items.push({ product: productId, quantity: Number(quantity) });
    }

    await cart.save();
    await cart.populate('items.product');

    return res.status(200).json(cart);
  } catch (error) {
    return res.status(400).json({ message: 'Unable to add item to cart', error: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (!quantity || Number(quantity) < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await normalizeCart(req.user._id);
    const item = cart.items.find((cartItem) => cartItem.product._id.toString() === productId);

    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    item.quantity = Number(quantity);
    await cart.save();
    await cart.populate('items.product');

    return res.status(200).json(cart);
  } catch (error) {
    return res.status(400).json({ message: 'Unable to update cart item', error: error.message });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await normalizeCart(req.user._id);
    cart.items = cart.items.filter((item) => item.product._id.toString() !== productId);

    await cart.save();
    await cart.populate('items.product');

    return res.status(200).json(cart);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to remove cart item' });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await normalizeCart(req.user._id);
    cart.items = [];
    await cart.save();

    return res.status(200).json(cart);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to clear cart' });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
