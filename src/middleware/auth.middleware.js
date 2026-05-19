const { adminToken } = require('../config/env');
const { hashToken } = require('../services/reseller.service');
const { findActiveByTokenHash } = require('../repositories/reseller.repository');
const { createAppError, sendError } = require('../utils/errors');

async function resellerAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return sendError(res, createAppError('UNAUTHORIZED', 'Unauthorized'));
  }
  const reseller = await findActiveByTokenHash(hashToken(token));
  if (!reseller) {
    return sendError(res, createAppError('UNAUTHORIZED', 'Unauthorized'));
  }
  req.reseller = reseller;
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
