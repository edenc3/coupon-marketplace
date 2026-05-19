const crypto = require('crypto');
const prisma = require('../config/prisma');
const { createAppError, sendError } = require('../utils/errors');

function hashBody(body) {
  return crypto.createHash('sha256').update(JSON.stringify(body ?? {})).digest('hex');
}

async function idempotency(req, res, next) {
  const key = req.headers['idempotency-key'];
  if (!key) return next();

  const bodyHash = hashBody(req.body);

  const existing = await prisma.idempotencyRecord.findFirst({
    where: { key, expires_at: { gt: new Date() } },
  });

  if (existing) {
    if (
      existing.method !== req.method ||
      existing.path !== req.path ||
      existing.body_hash !== bodyHash
    ) {
      return sendError(res, createAppError('IDEMPOTENCY_KEY_REUSED', 'Idempotency key was already used for a different request'));
    }
    return res.status(existing.response_status).json(existing.response_body);
  }

  const originalJson = res.json.bind(res);
  res.json = async function (body) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        await prisma.idempotencyRecord.create({
          data: {
            key,
            method: req.method,
            path: req.path,
            body_hash: bodyHash,
            response_status: res.statusCode,
            response_body: body,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
      } catch (err) {
        console.error('idempotency record write failed', err);
      }
    }
    return originalJson(body);
  };

  next();
}

module.exports = { idempotency };
