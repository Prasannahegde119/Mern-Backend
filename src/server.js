import { applyRouts } from "./middleware/route.js";
import { routs } from "./service/index.route.js";
import { config } from "dotenv";
import express from "express";
import axios from "axios";
import mongoose from "mongoose";
import cors from "cors";
import { verifyJwt } from "./middleware/JWT.js";

config();
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS fix - allow requests from Vercel frontend
app.use(
  cors({
    origin: "https://mern-frontend-phi-bice.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(verifyJwt);
const url = process.env.URL;

try {
  // MongoDB Connection
  await mongoose.connect(url);
  console.log("Connected to MongoDB");
} catch (error) {
  console.error("MongoDB connection error:", error);
}

// Define a schema for the user model
const { Schema, model } = mongoose;
const userSchema = new Schema({
  username: String,
  email: String,
  password: String,
});

export const User = model("User", userSchema);

// Define a schema for the product model
const productSchema = new Schema({
  id: Number,
  title: String,
  price: Number,
  description: String,
  category: String,
  image: String,
  rating: {
    rate: Number,
    count: Number,
  },
});

export const Product = model("Product", productSchema);

// Create schema for the cart model
const cartSchema = new Schema({
  id: Number,
  userId: String,
  productId: Number,
  quantity: Number,
});

export const Cart = model("Cart", cartSchema);

const addressSchema = new mongoose.Schema({
  id: Number,
  userId: String,
  name: String,
  phoneNumber: String,
  pincode: String,
  locality: String,
  address: String,
  city: String,
  country: String,
});

const Address = mongoose.model("Address", addressSchema);

// Define a schema for the order model
const orderSchema = new Schema(
  {
    userId: String,
    address: {
      name: String,
      phoneNumber: String,
      pincode: String,
      locality: String,
      address: String,
      city: String,
      country: String,
    },
    products: [String],
    totalPrice: Number,
    deliveryStatus: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Order = model("Order", orderSchema);

applyRouts(routs, app);

const fetchData = async () => {
  try {
    // ✅ Switched from fakestoreapi (blocked by Cloudflare) to dummyjson (free & reliable)
    const response = await axios.get("https://dummyjson.com/products?limit=20");
    const rawProducts = response.data.products;

    // ✅ Map dummyjson fields to match your existing product schema
    const products = rawProducts.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      description: p.description,
      category: p.category,
      image: p.thumbnail,
      rating: {
        rate: p.rating,
        count: p.stock,
      },
    }));

    // Delete old products
    await Product.deleteMany();

    // Insert fresh products
    await Product.insertMany(products);

    console.log("Fresh products inserted successfully");
  } catch (error) {
    console.error("Error fetching or inserting products:", error);
  }
};

// ✅ Manual trigger route to refresh products anytime from browser
app.get("/api/refresh-products", async (req, res) => {
  try {
    await fetchData();
    res.status(200).json({ message: "Products refreshed successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Failed to refresh products" });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    console.log(req.body);
    const { title, price, description, category, image, rating } = req.body;

    const newProduct = new Product({
      id: Math.floor(Math.random() * 1000),
      title,
      price,
      description,
      category,
      image,
      rating,
    });

    await newProduct.save();

    res
      .status(201)
      .json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/api/products/:productId", async (req, res) => {
  try {
    const productId = req.params.productId;
    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/products/:productId", async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching the data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/api/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.put("/api/users/:userId/edit-email", async (req, res) => {
  try {
    const { userId } = req.params;
    const { email } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { email },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error editing user email:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/cart/add", async (req, res) => {
  try {
    console.log(req.userId);
    const { productId, quantity } = req.body;

    const existingCartItem = await Cart.findOne({
      productId,
      userId: req.userId,
    });

    if (existingCartItem) {
      existingCartItem.quantity += quantity;
      await existingCartItem.save();

      return res.status(200).json({
        message: "Quantity updated successfully",
        cartItem: existingCartItem,
      });
    } else {
      const newCartItem = new Cart({
        userId: req.userId,
        productId,
        quantity,
      });

      await newCartItem.save();

      return res.status(201).json({
        message: "Item added to cart successfully",
        cartItem: newCartItem,
      });
    }
  } catch (error) {
    console.error("Error adding item to cart:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/cart", async (req, res) => {
  try {
    const userId = req.userId;
    const cartItems = await Cart.find({ userId });
    res.status(200).json(cartItems);
  } catch (error) {
    console.error("Error fetching cart details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/api/cart/remove/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    const cartItem = await Cart.findOne({ productId });

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    await cartItem.deleteOne();

    return res.status(200).json({ message: "Cart item removed successfully" });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/cart/clear", async (req, res) => {
  try {
    const userId = req.userId;
    await Cart.deleteMany({ userId });
    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error clearing the cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/addresses", async (req, res) => {
  try {
    const { name, phoneNumber, pincode, locality, address, city, country } =
      req.body;

    const newAddress = new Address({
      userId: req.userId,
      name,
      phoneNumber,
      pincode,
      locality,
      address,
      city,
      country,
    });

    await newAddress.save();

    res
      .status(201)
      .json({ message: "Address added successfully", address: newAddress });
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/getaddress", async (req, res) => {
  try {
    const userId = req.userId;
    const addresses = await Address.find({ userId });

    if (addresses.length === 0) {
      return res
        .status(404)
        .json({ message: "No addresses found for the user ID" });
    }

    res.status(200).json({ addresses });
  } catch (error) {
    console.error("Error retrieving addresses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { address, cartItems, totalPrice } = req.body;

    const newOrder = new Order({
      userId: req.userId,
      address,
      products: cartItems,
      totalPrice,
    });

    await newOrder.save();

    res
      .status(201)
      .json({ message: "Order placed successfully", order: newOrder });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/getorder", async (req, res) => {
  try {
    const userId = req.userId;
    const orders = await Order.find({ userId });
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/getallorders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.put("/api/orders/:orderId/update-delivery-status", async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { deliveryStatus: true },
      { new: true },
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Delivery status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating delivery status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Call once on server start
await fetchData();

// ✅ Auto re-fetch products every 24 hours to keep images fresh
setInterval(fetchData, 24 * 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
