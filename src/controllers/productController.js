const Product = require('../models/Product');

const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stockQuantity, category } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: 'Name, description, price, stockQuantity and category are required' });
    }

    if (typeof price !== 'number' || Number.isNaN(price) || price < 0) {
      return res.status(400).json({ message: 'Price must be a valid number and cannot be negative' });
    }

    if (stockQuantity === undefined || stockQuantity === null || typeof stockQuantity !== 'number' || Number.isNaN(stockQuantity) || stockQuantity < 0) {
      return res.status(400).json({ message: 'Stock quantity must be a valid number and cannot be negative' });
    }

    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      stockQuantity,
      category,
    });

    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    if (page < 1) {
      return res.status(400).json({ message: 'Page must be 1 or greater' });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({ message: 'Limit must be between 1 and 100' });
    }

    const search = req.query.search || '';
    const category = req.query.category || '';
    const inStock = req.query.inStock;

    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (category) {
      query.category = category;
    }

    if (inStock === 'true') {
      query.stockQuantity = { $gt: 0 };
    } else if (inStock === 'false') {
      query.stockQuantity = 0;
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const allowedFields = ['name', 'description', 'price', 'stockQuantity', 'category'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.price !== undefined && (typeof updates.price !== 'number' || Number.isNaN(updates.price) || updates.price < 0)) {
      return res.status(400).json({ message: 'Price must be a valid number and cannot be negative' });
    }

    if (updates.stockQuantity !== undefined && (typeof updates.stockQuantity !== 'number' || Number.isNaN(updates.stockQuantity) || updates.stockQuantity < 0)) {
      return res.status(400).json({ message: 'Stock quantity must be a valid number and cannot be negative' });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid product fields were supplied' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
