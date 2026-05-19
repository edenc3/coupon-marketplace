const prisma = require('../config/prisma');

async function createReseller(name, tokenHash) {
  return prisma.reseller.create({
    data: { name, token_hash: tokenHash },
    select: { id: true, name: true, is_active: true, created_at: true },
  });
}

async function findActiveByTokenHash(tokenHash) {
  return prisma.reseller.findFirst({
    where: { token_hash: tokenHash, is_active: true },
    select: { id: true },
  });
}

module.exports = { createReseller, findActiveByTokenHash };
