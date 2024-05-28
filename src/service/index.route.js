import { authenticateRouts } from "./authenticate/authenticate.route.js";
import { productRouts } from "./products/products.routs.js";
export const routs = [...authenticateRouts, ...productRouts];
