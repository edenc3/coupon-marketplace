const { port } = require('./config/env');
const app = require('./app');
const prisma = require('./config/prisma');

async function main() {
  await prisma.$connect();
  console.log('Database connected');

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

main().catch((err) => {
  console.error('Startup error:', err);
  process.exit(1);
});
