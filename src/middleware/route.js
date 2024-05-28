export const applyRouts = (routs, router) => {
  for (const route of routs) {
    switch (route.method) {
      case "post": {
        router.post(route.path, route.handler);
        break;
      }

      case "get": {
        router.get(route.path, route.handler);
        break;
      }

      case "put": {
        router.put(route.path, route.handler);
        break;
      }

      case "delete": {
        router.delete(route.path, route.handler);
        break;
      }
    }
  }
};

export const checkNothing = (req, res, next) => {
  next();
};
