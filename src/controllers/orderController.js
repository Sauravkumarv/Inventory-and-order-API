const Product = require('../models/Product');
const Order = require('../models/Order');

const createOrder = async (req, res, next) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Order must include at least one product' });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const item of products) {
      const { product: productId, quantity } = item;

      if (!productId) {
        return res.status(400).json({ message: 'Each order item must include a product ID' });
      }

      if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: 'Invalid product ID in order' });
      }

      if (typeof quantity !== 'number' || Number.isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ message: 'Quantity must be a number greater than 0' });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${productId}` });
      }

      if (quantity > product.stockQuantity) {
        return res.status(400).json({
          message: `Not enough stock for product: ${product.name}`,
        });
      }

      const itemTotal = product.price * quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        quantity,
        price: product.price,
      });
    }

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      product.stockQuantity -= item.quantity;
      await product.save();
    }

    const order = await Order.create({
      user: req.user._id,
      products: orderItems,
      totalAmount,
      status: 'confirmed',
    });

    const populatedOrder = await Order.findById(order._id).populate('products.product', 'name category');

    res.status(201).json({
      message: 'Order created successfully',
      order: populatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('products.product', 'name category').sort({ createdAt: -1 });

    res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findById(id).populate('products.product', 'name category');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
};
