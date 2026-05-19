const request = require('supertest');
const app = require('../app');
const prisma = require('../config/prisma');

const ADMIN_TOKEN = 'admin_token';
const ADMIN_AUTH = { Authorization: `Bearer ${ADMIN_TOKEN}` };

// ─── helpers ────────────────────────────────────────────────────────────────

async function createProduct(overrides = {}) {
  return request(app)
    .post('/api/admin/products')
    .set(ADMIN_AUTH)
    .send({
      name: 'Test Coupon',
      image_url: 'https://example.com/img.png',
      cost_price: 10,
      margin_percentage: 20,
      value_type: 'STRING',
      value: 'TESTCODE',
      ...overrides,
    });
}

async function createReseller(name = 'Acme Reseller') {
  const res = await request(app).post('/api/admin/resellers').set(ADMIN_AUTH).send({ name });
  return res.body; // { id, name, token, ... }
}

// ─── cleanup ────────────────────────────────────────────────────────────────

afterAll(async () => {
  await prisma.purchase.deleteMany({});
  await prisma.idempotencyRecord.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.reseller.deleteMany({});
  await prisma.$disconnect();
});

// ─── health ─────────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns 200 ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ─── admin auth ─────────────────────────────────────────────────────────────

describe('Admin auth', () => {
  it('rejects missing token', async () => {
    const res = await request(app).get('/api/admin/products');
    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe('UNAUTHORIZED');
  });

  it('rejects wrong token', async () => {
    const res = await request(app)
      .get('/api/admin/products')
      .set({ Authorization: 'Bearer wrong' });
    expect(res.status).toBe(401);
  });

  it('rejects malformed auth header', async () => {
    const res = await request(app)
      .get('/api/admin/products')
      .set({ Authorization: 'Basic admin_token' });
    expect(res.status).toBe(401);
  });

  it('accepts correct token', async () => {
    const res = await request(app).get('/api/admin/products').set(ADMIN_AUTH);
    expect(res.status).toBe(200);
  });
});

// ─── admin product CRUD ─────────────────────────────────────────────────────

describe('POST /api/admin/products', () => {
  it('creates a coupon with all required fields', async () => {
    const res = await createProduct({ name: 'Create Test' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Create Test');
    expect(res.body.coupon).toBeDefined();
    expect(Number(res.body.coupon.cost_price)).toBe(10);
    expect(Number(res.body.coupon.margin_percentage)).toBe(20);
    // minimum_sell_price = cost_price * (1 + margin/100) = 10 * 1.2 = 12
    expect(Number(res.body.coupon.minimum_sell_price)).toBe(12);
    expect(res.body.coupon.is_sold).toBe(false);
  });

  it('creates a coupon with optional description', async () => {
    const res = await createProduct({ name: 'With Desc', description: 'A description' });
    expect(res.status).toBe(201);
    expect(res.body.description).toBe('A description');
  });

  it('returns 422 when name is missing', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .set(ADMIN_AUTH)
      .send({ image_url: 'https://x.com/img.png', cost_price: 5, margin_percentage: 10, value_type: 'STRING', value: 'X' });
    expect(res.status).toBe(422);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 when image_url is not a valid URL', async () => {
    const res = await createProduct({ name: 'Bad URL', image_url: 'not-a-url' });
    expect(res.status).toBe(422);
  });

  it('returns 422 for invalid value_type', async () => {
    const res = await createProduct({ name: 'Bad Type', value_type: 'INVALID' });
    expect(res.status).toBe(422);
  });

  it('returns 422 when cost_price is negative', async () => {
    const res = await createProduct({ name: 'Neg Price', cost_price: -1 });
    expect(res.status).toBe(422);
  });

  it('accepts IMAGE value_type', async () => {
    const res = await createProduct({ name: 'Image Coupon', value_type: 'IMAGE', value: 'https://x.com/code.png' });
    expect(res.status).toBe(201);
    expect(res.body.coupon.value_type).toBe('IMAGE');
  });
});

describe('GET /api/admin/products', () => {
  it('returns an array', async () => {
    const res = await request(app).get('/api/admin/products').set(ADMIN_AUTH);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('includes coupon details in each product', async () => {
    await createProduct({ name: 'List Test' });
    const res = await request(app).get('/api/admin/products').set(ADMIN_AUTH);
    expect(res.status).toBe(200);
    const withCoupon = res.body.filter((p) => p.coupon != null);
    expect(withCoupon.length).toBeGreaterThan(0);
  });
});

describe('GET /api/admin/products/:id', () => {
  it('returns the product', async () => {
    const created = await createProduct({ name: 'GetById Test' });
    const id = created.body.id;

    const res = await request(app).get(`/api/admin/products/${id}`).set(ADMIN_AUTH);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(res.body.coupon).toBeDefined();
  });

  it('returns 404 for unknown uuid', async () => {
    const res = await request(app)
      .get('/api/admin/products/00000000-0000-0000-0000-000000000000')
      .set(ADMIN_AUTH);
    expect(res.status).toBe(404);
    expect(res.body.error_code).toBe('PRODUCT_NOT_FOUND');
  });

  it('returns 404 for non-uuid id', async () => {
    const res = await request(app).get('/api/admin/products/not-a-uuid').set(ADMIN_AUTH);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/admin/products/:id', () => {
  it('updates the product name', async () => {
    const created = await createProduct({ name: 'Before Update' });
    const id = created.body.id;

    const res = await request(app)
      .patch(`/api/admin/products/${id}`)
      .set(ADMIN_AUTH)
      .send({ name: 'After Update' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('After Update');
  });

  it('updates cost_price and recalculates minimum_sell_price', async () => {
    const created = await createProduct({ name: 'Price Update', cost_price: 10, margin_percentage: 20 });
    const id = created.body.id;

    // 20 * 1.2 = 24
    const res = await request(app)
      .patch(`/api/admin/products/${id}`)
      .set(ADMIN_AUTH)
      .send({ cost_price: 20 });
    expect(res.status).toBe(200);
    expect(Number(res.body.coupon.cost_price)).toBe(20);
    expect(Number(res.body.coupon.minimum_sell_price)).toBe(24);
  });

  it('updates margin_percentage and recalculates minimum_sell_price', async () => {
    const created = await createProduct({ name: 'Margin Update', cost_price: 10, margin_percentage: 10 });
    const id = created.body.id;

    // 10 * 1.5 = 15
    const res = await request(app)
      .patch(`/api/admin/products/${id}`)
      .set(ADMIN_AUTH)
      .send({ margin_percentage: 50 });
    expect(res.status).toBe(200);
    expect(Number(res.body.coupon.minimum_sell_price)).toBe(15);
  });

  it('can clear description with null', async () => {
    const created = await createProduct({ name: 'Desc Clear', description: 'something' });
    const id = created.body.id;

    const res = await request(app)
      .patch(`/api/admin/products/${id}`)
      .set(ADMIN_AUTH)
      .send({ description: null });
    expect(res.status).toBe(200);
    expect(res.body.description).toBeNull();
  });

  it('returns 422 for empty body', async () => {
    const created = await createProduct({ name: 'Empty Patch' });
    const res = await request(app)
      .patch(`/api/admin/products/${created.body.id}`)
      .set(ADMIN_AUTH)
      .send({});
    expect(res.status).toBe(422);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app)
      .patch('/api/admin/products/00000000-0000-0000-0000-000000000000')
      .set(ADMIN_AUTH)
      .send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it('returns 409 when trying to update a sold product', async () => {
    const created = await createProduct({ name: 'Sold Update Test' });
    const id = created.body.id;
    await request(app).post(`/api/v1/products/${id}/purchase/direct`);

    const res = await request(app)
      .patch(`/api/admin/products/${id}`)
      .set(ADMIN_AUTH)
      .send({ name: 'Changed' });
    expect(res.status).toBe(409);
    expect(res.body.error_code).toBe('PRODUCT_ALREADY_SOLD');
  });
});

describe('DELETE /api/admin/products/:id', () => {
  it('deletes an unsold product', async () => {
    const created = await createProduct({ name: 'To Delete' });
    const id = created.body.id;

    const del = await request(app).delete(`/api/admin/products/${id}`).set(ADMIN_AUTH);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/api/admin/products/${id}`).set(ADMIN_AUTH);
    expect(get.status).toBe(404);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app)
      .delete('/api/admin/products/00000000-0000-0000-0000-000000000000')
      .set(ADMIN_AUTH);
    expect(res.status).toBe(404);
  });

  it('returns 409 when trying to delete a sold product', async () => {
    const created = await createProduct({ name: 'Sold Delete Test' });
    const id = created.body.id;
    await request(app).post(`/api/v1/products/${id}/purchase/direct`);

    const res = await request(app).delete(`/api/admin/products/${id}`).set(ADMIN_AUTH);
    expect(res.status).toBe(409);
    expect(res.body.error_code).toBe('PRODUCT_ALREADY_SOLD');
  });
});

// ─── admin reseller creation ────────────────────────────────────────────────

describe('POST /api/admin/resellers', () => {
  it('creates a reseller and returns a token', async () => {
    const res = await request(app)
      .post('/api/admin/resellers')
      .set(ADMIN_AUTH)
      .send({ name: 'New Reseller' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('New Reseller');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
    // token must NOT be stored as plaintext (id is uuid, token is hex)
    expect(res.body.token).not.toBe(res.body.id);
  });

  it('returns 422 when name is missing', async () => {
    const res = await request(app).post('/api/admin/resellers').set(ADMIN_AUTH).send({});
    expect(res.status).toBe(422);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });
});

// ─── public product listing ─────────────────────────────────────────────────

describe('GET /api/v1/products (public)', () => {
  it('returns only unsold products', async () => {
    const created = await createProduct({ name: 'Public List Test' });
    const id = created.body.id;

    const before = await request(app).get('/api/v1/products');
    const beforeIds = before.body.map((p) => p.id);
    expect(beforeIds).toContain(id);

    // sell it
    await request(app).post(`/api/v1/products/${id}/purchase/direct`);

    const after = await request(app).get('/api/v1/products');
    const afterIds = after.body.map((p) => p.id);
    expect(afterIds).not.toContain(id);
  });

  it('does not expose cost_price or coupon value', async () => {
    await createProduct({ name: 'Privacy Test' });
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    for (const p of res.body) {
      expect(p.coupon?.cost_price).toBeUndefined();
      expect(p.coupon?.value).toBeUndefined();
      expect(p.coupon?.minimum_sell_price).toBeDefined();
    }
  });
});

describe('GET /api/v1/products/:id (public)', () => {
  it('returns unsold product with public fields', async () => {
    const created = await createProduct({ name: 'Public GetById' });
    const id = created.body.id;

    const res = await request(app).get(`/api/v1/products/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(res.body.coupon.minimum_sell_price).toBeDefined();
    expect(res.body.coupon.value).toBeUndefined();
  });

  it('returns 404 for a sold product', async () => {
    const created = await createProduct({ name: 'Sold Public GetById' });
    const id = created.body.id;
    await request(app).post(`/api/v1/products/${id}/purchase/direct`);

    const res = await request(app).get(`/api/v1/products/${id}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for unknown uuid', async () => {
    const res = await request(app).get('/api/v1/products/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});

// ─── direct purchase ────────────────────────────────────────────────────────

describe('POST /api/v1/products/:id/purchase/direct', () => {
  it('successfully purchases an unsold product', async () => {
    const created = await createProduct({ name: 'Direct Purchase', cost_price: 10, margin_percentage: 20, value: 'DIRECT-CODE' });
    const id = created.body.id;

    const res = await request(app).post(`/api/v1/products/${id}/purchase/direct`);
    expect(res.status).toBe(200);
    expect(res.body.product_id).toBe(id);
    expect(res.body.value).toBe('DIRECT-CODE');
    expect(Number(res.body.final_price)).toBe(12); // 10 * 1.2
    expect(res.body.value_type).toBe('STRING');
  });

  it('returns 409 when product is already sold', async () => {
    const created = await createProduct({ name: 'Double Direct' });
    const id = created.body.id;
    await request(app).post(`/api/v1/products/${id}/purchase/direct`);

    const res = await request(app).post(`/api/v1/products/${id}/purchase/direct`);
    expect(res.status).toBe(409);
    expect(res.body.error_code).toBe('PRODUCT_ALREADY_SOLD');
  });

  it('returns 404 for unknown product', async () => {
    const res = await request(app).post('/api/v1/products/00000000-0000-0000-0000-000000000000/purchase/direct');
    expect(res.status).toBe(404);
  });

  it('returns 404 for non-uuid id', async () => {
    const res = await request(app).post('/api/v1/products/not-a-uuid/purchase/direct');
    expect(res.status).toBe(404);
  });
});

// ─── reseller purchase ──────────────────────────────────────────────────────

describe('POST /api/v1/products/:id/purchase (reseller auth)', () => {
  it('returns 401 without auth header', async () => {
    const created = await createProduct({ name: 'Reseller Auth Test' });
    const res = await request(app)
      .post(`/api/v1/products/${created.body.id}/purchase`)
      .send({ reseller_price: 15 });
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const created = await createProduct({ name: 'Reseller Bad Token' });
    const res = await request(app)
      .post(`/api/v1/products/${created.body.id}/purchase`)
      .set({ Authorization: 'Bearer notarealtoken' })
      .send({ reseller_price: 15 });
    expect(res.status).toBe(401);
  });

  it('successfully purchases with valid reseller token and price', async () => {
    const reseller = await createReseller('Buyer A');
    const created = await createProduct({ name: 'Reseller Purchase', cost_price: 10, margin_percentage: 20, value: 'RESELLER-CODE' });
    const id = created.body.id;

    const res = await request(app)
      .post(`/api/v1/products/${id}/purchase`)
      .set({ Authorization: `Bearer ${reseller.token}` })
      .send({ reseller_price: 15 });
    expect(res.status).toBe(200);
    expect(res.body.product_id).toBe(id);
    expect(res.body.value).toBe('RESELLER-CODE');
    expect(Number(res.body.final_price)).toBe(15);
  });

  it('returns 400 when reseller_price is below minimum_sell_price', async () => {
    const reseller = await createReseller('Buyer B');
    const created = await createProduct({ name: 'Price Too Low', cost_price: 10, margin_percentage: 20 });
    const id = created.body.id;

    const res = await request(app)
      .post(`/api/v1/products/${id}/purchase`)
      .set({ Authorization: `Bearer ${reseller.token}` })
      .send({ reseller_price: 5 });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('RESELLER_PRICE_TOO_LOW');
  });

  it('returns 422 when reseller_price is missing', async () => {
    const reseller = await createReseller('Buyer C');
    const created = await createProduct({ name: 'Missing Price' });
    const id = created.body.id;

    const res = await request(app)
      .post(`/api/v1/products/${id}/purchase`)
      .set({ Authorization: `Bearer ${reseller.token}` })
      .send({});
    expect(res.status).toBe(422);
    expect(res.body.error_code).toBe('VALIDATION_ERROR');
  });

  it('returns 409 when product is already sold', async () => {
    const reseller = await createReseller('Buyer D');
    const created = await createProduct({ name: 'Already Sold Reseller' });
    const id = created.body.id;
    await request(app).post(`/api/v1/products/${id}/purchase/direct`);

    const res = await request(app)
      .post(`/api/v1/products/${id}/purchase`)
      .set({ Authorization: `Bearer ${reseller.token}` })
      .send({ reseller_price: 15 });
    expect(res.status).toBe(409);
    expect(res.body.error_code).toBe('PRODUCT_ALREADY_SOLD');
  });

  it('returns 404 for unknown product id', async () => {
    const reseller = await createReseller('Buyer E');
    const res = await request(app)
      .post('/api/v1/products/00000000-0000-0000-0000-000000000000/purchase')
      .set({ Authorization: `Bearer ${reseller.token}` })
      .send({ reseller_price: 15 });
    expect(res.status).toBe(404);
  });
});

// ─── idempotency ─────────────────────────────────────────────────────────────

describe('Idempotency middleware', () => {
  it('returns cached response on duplicate request with same key', async () => {
    const reseller = await createReseller('Idempotency Buyer A');
    const created = await createProduct({ name: 'Idempotency Test 1', value: 'IDEM-CODE-1' });
    const id = created.body.id;
    const key = `test-key-${Date.now()}`;

    const res1 = await request(app)
      .post(`/api/v1/products/${id}/purchase`)
      .set({ Authorization: `Bearer ${reseller.token}`, 'Idempotency-Key': key })
      .send({ reseller_price: 15 });
    expect(res1.status).toBe(200);

    // Second request with same key and same body should return cached response
    const res2 = await request(app)
      .post(`/api/v1/products/${id}/purchase`)
      .set({ Authorization: `Bearer ${reseller.token}`, 'Idempotency-Key': key })
      .send({ reseller_price: 15 });
    expect(res2.status).toBe(200);
    expect(res2.body).toEqual(res1.body);
  });

  it('returns 422 when key is reused with different body', async () => {
    const reseller = await createReseller('Idempotency Buyer B');
    const created = await createProduct({ name: 'Idempotency Test 2', cost_price: 5, margin_percentage: 10 });
    const id = created.body.id;
    const key = `test-key-conflict-${Date.now()}`;

    // First purchase succeeds
    await request(app)
      .post(`/api/v1/products/${id}/purchase`)
      .set({ Authorization: `Bearer ${reseller.token}`, 'Idempotency-Key': key })
      .send({ reseller_price: 10 });

    // Same key, different price
    const res2 = await request(app)
      .post(`/api/v1/products/${id}/purchase`)
      .set({ Authorization: `Bearer ${reseller.token}`, 'Idempotency-Key': key })
      .send({ reseller_price: 20 });
    expect(res2.status).toBe(422);
    expect(res2.body.error_code).toBe('IDEMPOTENCY_KEY_REUSED');
  });

  it('skips idempotency check when no key is provided', async () => {
    const reseller = await createReseller('Idempotency Buyer C');
    const created = await createProduct({ name: 'No Idempotency Key' });
    const id = created.body.id;

    const res = await request(app)
      .post(`/api/v1/products/${id}/purchase`)
      .set({ Authorization: `Bearer ${reseller.token}` })
      .send({ reseller_price: 15 });
    // Should proceed normally (success or business error, not middleware error)
    expect([200, 400, 409]).toContain(res.status);
  });
});

// ─── pricing helper ──────────────────────────────────────────────────────────

describe('Pricing calculation', () => {
  it('calculates minimum_sell_price correctly (cost * (1 + margin/100))', async () => {
    const cases = [
      { cost: 100, margin: 10, expected: 110 },
      { cost: 50, margin: 0, expected: 50 },
      { cost: 25, margin: 100, expected: 50 },
    ];
    for (const { cost, margin, expected } of cases) {
      const res = await createProduct({ name: `Pricing ${cost}/${margin}`, cost_price: cost, margin_percentage: margin });
      expect(res.status).toBe(201);
      expect(Number(res.body.coupon.minimum_sell_price)).toBe(expected);
    }
  });
});
