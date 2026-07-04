import * as z from "zod";

export const schema = (schema) => {
  return async (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const formattedErrors = result.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return next(
        Object.assign(new Error("Validation Error"), {
          cause: 400,
          errors: formattedErrors,
        }),
      );
    }

    req.body = result.data.body;
    req.params = result.data.params || {};
    req.query = result.data.query || {};

    next();
  };
};
