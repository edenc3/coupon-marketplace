const crypto = require('crypto');
const Joi = require('joi');
const repo = require('../repositories/reseller.repository');
const { createAppError } = require('../utils/errors');

const createResellerSchema = Joi.object({
  name: Joi.string().required(),
});

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createReseller(body) {
  const { error, value } = createResellerSchema.validate(body);
  if (error) throw createAppError('VALIDATION_ERROR', error.details[0].message);

  const token = crypto.randomBytes(32).toString('hex');
  const reseller = await repo.createReseller(value.name, hashToken(token));

  return { ...reseller, token };
}

module.exports = { createReseller, hashToken };
