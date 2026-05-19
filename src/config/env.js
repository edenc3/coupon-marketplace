require('dotenv').config();

const required = ['DATABASE_URL', 'ADMIN_TOKEN'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  adminToken: process.env.ADMIN_TOKEN,
  port: parseInt(process.env.PORT || '3000', 10),
};
