const request = require('supertest');
const app = require('../app');
const prisma = require('../config/prisma');

let productId;

beforeAll(async () => {
  const product = await prisma.product.create({
    data: {
      name: 'Test Coupon',
      type: 'COUPON',
      image_url: 'https://example.com/img.png',
      coupon: {
        create: {
          cost_price: 10.0,
          margin_percentage: 20.0,
          minimum_sell_price: 12.0,
          value_type: 'STRING',
          value: 'TEST-CODE-123',
        },
      },
    },
  });
  productId = product.id;
});

afterAll(async () => {
  await prisma.purchase.deleteMany({ where: { coupon: { product: { name: 'Test Coupon' } } } });
  await prisma.product.deleteMany({ where: { name: 'Test Coupon' } });
  await prisma.$disconnect();
});

test('two simultaneous direct purchases result in exactly one success', async () => {
  const [res1, res2] = await Promise.all([
    request(app).post(`/api/v1/products/${productId}/purchase/direct`),
    request(app).post(`/api/v1/products/${productId}/purchase/direct`),
  ]);

  const statuses = [res1.status, res2.status].sort();

  expect(statuses).toEqual([200, 409]);
});
