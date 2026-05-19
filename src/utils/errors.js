const STATUS_MAP = {
  PRODUCT_NOT_FOUND: 404,
  PRODUCT_ALREADY_SOLD: 409,
  RESELLER_PRICE_TOO_LOW: 400,
  UNAUTHORIZED: 401,
  VALIDATION_ERROR: 422,
  IDEMPOTENCY_KEY_REUSED: 422,
};

function createAppError(error_code, message) {
  const err = new Error(message);
  err.error_code = error_code;
  return err;
}

function sendError(res, err) {
  const error_code = err.error_code || 'INTERNAL_ERROR';
  const status = STATUS_MAP[error_code] || 500;
  res.status(status).json({ error_code, message: err.message });
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch((err) => sendError(res, err));
}

module.exports = { createAppError, sendError, asyncHandler };
