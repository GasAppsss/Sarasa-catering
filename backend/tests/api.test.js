import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { createStore } from '../src/db/index.js';
import { getDateOffsetIso } from '../src/shared/seedDefaults.js';

describe('Sajian Catering Backend API & RBAC', () => {
  let app;
  let store;
  let kitchenToken;
  let adminToken;
  let devToken;

  beforeAll(async () => {
    const config = loadConfig({
      NODE_ENV: 'test',
      DB_DRIVER: 'sqlite',
      SQLITE_PATH: ':memory:',
      CORS_ORIGINS: 'http://localhost:5173',
    });
    store = createStore(config);
    await store.ensureReady();
    app = createApp({ config, store });
  });

  afterAll(async () => {
    await store.close();
  });

  it('serves /api/health and strips HPP/PII from /api/public/bootstrap', async () => {
    const healthRes = await request(app).get('/api/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.ok).toBe(true);

    const res = await request(app).get('/api/public/bootstrap');
    expect(res.status).toBe(200);
    expect(res.body.config.brand.name).toBe('SAJIAN CATERING');
    expect(res.body.packages.length).toBeGreaterThanOrEqual(6);
    expect(res.body.packages[0].hpp).toBeUndefined();
    expect(res.body.stalls[0].hpp).toBeUndefined();
    expect(res.body.orders).toBeUndefined();
    expect(res.body.calendarSlots).toHaveLength(14);
  });

  it('computes authoritative prices server-side on POST /api/orders and protects /api/orders/track', async () => {
    const targetDate = getDateOffsetIso(12);
    const createRes = await request(app)
      .post('/api/orders')
      .send({
        packageId: 'pkg-2',
        pax: 30,
        stalls: [{ id: 'stall-sate', pax: 30 }],
        customerName: 'Ibu Nabila',
        whatsapp: '0812-7777-8899',
        eventDate: targetDate,
        eventTime: '12:00',
        address: 'Jl. Kemang Raya No. 15, Jakarta Selatan',
        notes: 'Tanpa kacang untuk 2 porsi',
        totalAmount: 1, // Attempted price tampering should be ignored
      });

    expect(createRes.status).toBe(201);
    const created = createRes.body.order;
    // 30 * 42000 + 30 * 20000 = 1,860,000; 50% DP = 930,000
    expect(created.totalAmount).toBe(1860000);
    expect(created.dpAmount).toBe(930000);
    expect(created.packageHpp).toBeUndefined();

    // Tracking with wrong WhatsApp must fail
    const badTrack = await request(app)
      .get('/api/orders/track')
      .query({ orderId: created.id, whatsapp: '0899999999' });
    expect(badTrack.status).toBe(404);

    // Tracking with matching WhatsApp succeeds
    const goodTrack = await request(app)
      .get('/api/orders/track')
      .query({ orderId: created.id, whatsapp: '081277778899' });
    expect(goodTrack.status).toBe(200);
    expect(goodTrack.body.order.id).toBe(created.id);
    expect(goodTrack.body.order.packageHpp).toBeUndefined();
  });

  it('rejects invalid PIN login and enforces strict server-side RBAC scopes across kitchen/admin/developer', async () => {
    const badLogin = await request(app).post('/api/auth/login').send({ role: 'admin', pin: '0000' });
    expect(badLogin.status).toBe(401);

    const kitchenLogin = await request(app).post('/api/auth/login').send({ role: 'kitchen', pin: '1122' });
    expect(kitchenLogin.status).toBe(200);
    kitchenToken = kitchenLogin.body.token;

    const adminLogin = await request(app).post('/api/auth/login').send({ role: 'admin', pin: '2233' });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.token;

    const devLogin = await request(app).post('/api/auth/login').send({ role: 'developer', pin: '9900' });
    expect(devLogin.status).toBe(200);
    devToken = devLogin.body.token;

    // Kitchen cannot access Admin analytics or Developer state
    const kToAdmin = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${kitchenToken}`);
    expect(kToAdmin.status).toBe(403);

    const kToDev = await request(app)
      .get('/api/developer/state')
      .set('Authorization', `Bearer ${kitchenToken}`);
    expect(kToDev.status).toBe(403);

    // Kitchen sheet strips pricing/HPP
    const sheetRes = await request(app)
      .get('/api/kitchen/sheet')
      .set('Authorization', `Bearer ${kitchenToken}`);
    expect(sheetRes.status).toBe(200);
    if (sheetRes.body.sheet.ordersOnDate.length > 0) {
      expect(sheetRes.body.sheet.ordersOnDate[0].totalAmount).toBeUndefined();
      expect(sheetRes.body.sheet.ordersOnDate[0].packageHpp).toBeUndefined();
    }

    // Admin can access admin dashboard, but CANNOT access developer endpoints
    const aToAdmin = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(aToAdmin.status).toBe(200);
    expect(aToAdmin.body.kpis.totalOmzet).toBeGreaterThan(0);

    const aToDev = await request(app)
      .get('/api/developer/state')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(aToDev.status).toBe(403);

    // Developer can read state and rotate PINs
    const dToDev = await request(app)
      .get('/api/developer/state')
      .set('Authorization', `Bearer ${devToken}`);
    expect(dToDev.status).toBe(200);
    expect(dToDev.body.rbacMatrix.kitchen).toContain('kitchen_stage:update');
    expect(dToDev.body.rbacMatrix.admin).not.toContain('dev_theme_tokens:edit');
  });

  it('allows Kitchen stage updates, Admin catalog/settings updates, and Developer PIN/flag changes', async () => {
    const stageRes = await request(app)
      .patch('/api/kitchen/orders/SJC-2026-002/stage')
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ kitchenStage: 'Sedang Dimasak' });
    expect(stageRes.status).toBe(200);
    expect(stageRes.body.order.kitchenStage).toBe('Sedang Dimasak');
    expect(stageRes.body.order.status).toBe('Diproses Dapur');

    const pkgRes = await request(app)
      .post('/api/admin/packages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Paket VIP Keraton',
        category: 'Prasmanan',
        plateStyle: 'buffet',
        accentTint: '#064E3B',
        price: 85000,
        hpp: 45000,
        minOrder: 50,
        chefName: 'Chef Feny Maharani',
        items: ['Nasi Pandan', 'Empal Gentong'],
      });
    expect(pkgRes.status).toBe(201);
    expect(pkgRes.body.package.name).toBe('Paket VIP Keraton');

    const devConfigRes = await request(app)
      .put('/api/developer/config')
      .set('Authorization', `Bearer ${devToken}`)
      .send({
        featureFlags: {
          enableClientPortal: true,
          enableCatalogFilter: true,
          enableVideoPreview: true,
          enableTestimonials: true,
          enableFaqSection: true,
          enableWhatsAppCheckout: true,
          enableDemoQuickSwitch: true,
        },
        rolePins: { kitchen: '5566' },
      });
    expect(devConfigRes.status).toBe(200);
    expect(devConfigRes.body.config.featureFlags.enableDemoQuickSwitch).toBe(true);

    // Old kitchen PIN fails, new PIN works
    const oldPin = await request(app).post('/api/auth/login').send({ role: 'kitchen', pin: '1122' });
    expect(oldPin.status).toBe(401);
    const newPin = await request(app).post('/api/auth/login').send({ role: 'kitchen', pin: '5566' });
    expect(newPin.status).toBe(200);
  });
});
