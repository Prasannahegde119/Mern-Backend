import { checkNothing } from "../../middleware/route.js";
import { ProductController } from "./products.controller.js";

export const productRouts = [
  {
    path: "/api/products",
    method: "get",
    handler: [
      checkNothing,
      async (req, res) => {
        try {
          const controller = new ProductController();
          const data = await controller.products();
          return res.status(200).json(data);

          //   return res
          //     .status(201)
          //     .json({ message: "product fetched successfully" });
        } catch (error) {
          console.error("Error fetching products:", error);
          return res.status(500).json({ message: "Internal server error" });
        }
      },
    ],
  },
];
