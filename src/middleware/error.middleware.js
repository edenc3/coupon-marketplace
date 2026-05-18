'use strict';

const { sendError } = require('../utils/errors');

function globalErrorHandler(err, req, res, next) {
  sendError(res, err);
}

module.exports = { globalErrorHandler };
