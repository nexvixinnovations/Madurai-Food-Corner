const ApiError = require('../utils/apiError');

const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }
    if (schema.params) {
      req.params = schema.params.parse(req.params);
    }
    if (schema.query) {
      req.query = schema.query.parse(req.query);
    }
    next();
  } catch (error) {
    const errorMessages = error.errors?.map((err) => `${err.path.join('.')}: ${err.message}`) || [error.message];
    next(new ApiError(400, 'Validation Error', errorMessages));
  }
};

module.exports = validate;
