'use strict';

require('dotenv').config();

const required = ['DATABASE_URL', 'RESELLER_API_TOKEN', 'ADMIN_TOKEN'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  resellerApiToken: process.env.RESELLER_API_TOKEN,
  adminToken: process.env.ADMIN_TOKEN,
  port: parseInt(process.env.PORT || '3000', 10),
};
