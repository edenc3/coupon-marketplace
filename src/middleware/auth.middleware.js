'use strict';

const { resellerApiToken, adminToken } = require('../config/env');
const { createAppError, sendError } = require('../utils/errors');

function resellerAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || token !== resellerApiToken) {
    return sendError(res, createAppError('UNAUTHORIZED', 'Unauthorized'));
  }
  next();
}

function adminAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || token !== adminToken) {
    return sendError(res, createAppError('UNAUTHORIZED', 'Unauthorized'));
  }
  next();
}

module.exports = { resellerAuth, adminAuth };
