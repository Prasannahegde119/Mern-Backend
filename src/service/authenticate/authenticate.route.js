import { checkNothing } from "../../middleware/route.js";
import { AuthenticateController } from "./authenticate.controller.js";

export const authenticateRouts = [
  {
    path: "/api/register",
    method: "post",
    handler: [
      checkNothing,
      async (req, res) => {
        try {
          const controller = new AuthenticateController();
          await controller.register(req.body);

          return res
            .status(201)
            .json({ message: "User registered successfully" });
        } catch (error) {
          console.error("Error registering user:", error);
          return res.status(500).json({ message: "Internal server error" });
        }
      },
    ],
  },
  {
    path: "/api/login",
    method: "post",
    handler: [
      checkNothing,
      async (req, res) => {
        try {
          const controller = new AuthenticateController();
          await controller.login(req.body, res);
        } catch (error) {
          console.error("Error registering user:", error);
          return res.status(500).json({ message: "Internal server error" });
        }
      },
    ],
  },
  {
    path: "/api/users",
    method: "get",
    handler: [
      checkNothing,
      async (req, res) => {
        try {
          const controller = new AuthenticateController();
          const data = await controller.users(req.body, res);

          return res.status(200).json(data);
        } catch (error) {
          console.error("Error fetching users:", error);
          return res.status(500).json({ message: "Internal server error" });
        }
      },
    ],
  },
];
