import * as z from "zod";

export const schema = (zodSchema) => {
  return (req, res, next) => {
    const result = zodSchema.safeParse({
      body: req.body,
      file: req.file,
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

    if (result.data.body) {
      req.body = result.data.body;
    }
    if (result.data.params) {
      req.params = result.data.params;
    }
    if (result.data.query) {
      req.query = result.data.query;
    }

    next();
  };
};
