import { Product } from "../../server.js";

export class ProductController {
  async products() {
    const products = await Product.find();
    return products;
  }
}
