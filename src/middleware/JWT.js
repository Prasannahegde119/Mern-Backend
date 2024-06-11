import JWT from "jsonwebtoken";

const includeApi = [
  "/api/cart/add",
  "/api/cart",
  "/api/addresses",
  "/api/getaddress",
  "/api/orders",
  "/api/getorder",
  // "/api/getallorders",
  "/api/cart/clear",
];
export function verifyJwt(req, res, next) {
  if (!includeApi.includes(req.path)) return next();
  checkToken(req, res, next);
}

function checkToken(req, res, next) {
  const jwtToken = req.headers.authorization;

  if (!jwtToken) return res.status(401).json({ message: "Unauthorized" });

  const authToken = JWT.verify(jwtToken, process.env.JWT_SECRET_KEY);
  if (!authToken || !authToken.userId)
    return res.status(401).json({ message: "Unauthorized" });
  req.userId = authToken.userId;
  next();
}
