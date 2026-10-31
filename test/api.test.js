import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { ensureMongoRunning } from '../src/config/mongoLauncher.js';

describe('Backend API Endpoints', () => {
  before(async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/biz_zolution';
    await ensureMongoRunning(uri);
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }
  });

  after(async () => {
    await mongoose.disconnect();
  });

  it('GET /api/v1/health should return status healthy', async () => {
    const res = await request(app).get('/api/v1/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
  });

  it('GET /api/v1/categories should return category list', async () => {
    const res = await request(app).get('/api/v1/categories');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  it('GET /api/v1/services should return services pagination', async () => {
    const res = await request(app).get('/api/v1/services');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.pagination);
  });

  it('GET /api/v1/services/brands should return brands with discount rates', async () => {
    const res = await request(app).get('/api/v1/services/brands');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    const skf = res.body.data.find((b) => b.brand === 'SKF');
    if (skf) {
      assert.strictEqual(skf.discountPercentage, 10);
    }
  });

  it('GET /api/v1/services?brand=SKF should return SKF bearings', async () => {
    const res = await request(app).get('/api/v1/services?brand=SKF');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.length > 0);
    res.body.data.forEach((p) => {
      assert.strictEqual(p.brand, 'SKF');
      assert.strictEqual(p.discountPercentage, 10);
    });
  });

  it('POST /api/v1/enquiries with RFQ type should create RFQ', async () => {
    const res = await request(app)
      .post('/api/v1/enquiries')
      .send({
        name: 'Test Procurement Head',
        email: 'test@mill.com',
        subject: 'Bulk RFQ Test',
        message: 'Looking for 50 pcs 6204ZZ',
        enquiryType: 'rfq',
        brand: 'HCH',
        partNumber: '6204zz',
        quantity: 50,
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.enquiryType, 'rfq');
  });

  it('POST /api/v1/auth/login with invalid password should fail', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@bizzolution.com', password: 'WrongPassword' });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });
});
