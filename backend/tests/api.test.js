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

  it('rejects invalid credentials/role mismatch and enforces strict server-side RBAC scopes across kitchen/admin/developer', async () => {
    const badLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'admin@sajiancatering.id', password: 'WrongPassword1', role: 'admin' });
    expect(badLogin.status).toBe(401);

    // Role mismatch rejected
    const wrongRole = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'admin@sajiancatering.id', password: 'Admin#2026', role: 'developer' });
    expect(wrongRole.status).toBe(403);

    const kitchenLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'dapur', password: 'Dapur#2026', role: 'kitchen' });
    expect(kitchenLogin.status).toBe(200);
    expect(kitchenLogin.body.account.email).toBe('dapur@sajiancatering.id');
    kitchenToken = kitchenLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'admin@sajiancatering.id', password: 'Admin#2026', role: 'admin', rememberMe: true });
    expect(adminLogin.status).toBe(200);
    expect(adminLogin.body.expiresIn).toBeGreaterThan(86400);
    adminToken = adminLogin.body.token;

    const devLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'dev@sajiancatering.id', password: 'Dev#Sajian99', role: 'developer' });
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
        rolePins: { kitchen: 'Dapur#5566' },
      });
    expect(devConfigRes.status).toBe(200);
    expect(devConfigRes.body.config.featureFlags.enableDemoQuickSwitch).toBe(true);

    // Old kitchen password fails, new password works
    const oldPw = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'dapur@sajiancatering.id', password: 'Dapur#2026' });
    expect(oldPw.status).toBe(401);
    const newPw = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'dapur@sajiancatering.id', password: 'Dapur#5566' });
    expect(newPw.status).toBe(200);
  });

  it('supports Forgot Password via 6-digit OTP and Master Recovery Key, plus Change Password, Recovery Key rotation, and brute-force lockout', async () => {
    // 1) Forgot password via 6-digit OTP for Admin
    const reqReset = await request(app)
      .post('/api/auth/forgot-password')
      .send({ identifier: 'admin@sajiancatering.id' });
    expect(reqReset.status).toBe(200);
    expect(reqReset.body.previewCode).toMatch(/^\d{6}$/);
    const otpCode = reqReset.body.previewCode;

    // Wrong OTP rejected
    const badOtp = await request(app)
      .post('/api/auth/verify-reset-code')
      .send({ identifier: 'admin@sajiancatering.id', code: '000000' });
    expect(badOtp.status).toBe(400);

    // Valid OTP verified
    const goodOtp = await request(app)
      .post('/api/auth/verify-reset-code')
      .send({ identifier: 'admin@sajiancatering.id', code: otpCode });
    expect(goodOtp.status).toBe(200);

    // Complete password reset with OTP
    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        method: 'otp',
        identifier: 'admin@sajiancatering.id',
        code: otpCode,
        newPassword: 'AdminBaru#2027',
        confirmPassword: 'AdminBaru#2027',
      });
    expect(resetRes.status).toBe(200);

    // Reusing OTP must fail
    const reuseOtp = await request(app)
      .post('/api/auth/reset-password')
      .send({
        method: 'otp',
        identifier: 'admin@sajiancatering.id',
        code: otpCode,
        newPassword: 'AdminBaru#2028',
        confirmPassword: 'AdminBaru#2028',
      });
    expect(reuseOtp.status).toBe(400);

    // Login with new password succeeds
    const relogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'admin', password: 'AdminBaru#2027', role: 'admin' });
    expect(relogin.status).toBe(200);
    const freshAdminToken = relogin.body.token;

    // 2) Admin changes own password & rotates own Recovery Key
    const changePw = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${freshAdminToken}`)
      .send({
        currentPassword: 'AdminBaru#2027',
        newPassword: 'AdminFinal#2029',
        confirmPassword: 'AdminFinal#2029',
      });
    expect(changePw.status).toBe(200);

    const rotateRes = await request(app)
      .post('/api/auth/recovery-key/rotate')
      .set('Authorization', `Bearer ${freshAdminToken}`)
      .send({ currentPassword: 'AdminFinal#2029' });
    expect(rotateRes.status).toBe(200);
    expect(rotateRes.body.recoveryKey).toMatch(/^SJC-ADM-/);

    // 3) Forgot password via Master Recovery Key for Developer
    const badKeyReset = await request(app)
      .post('/api/auth/reset-password')
      .send({
        method: 'recovery_key',
        identifier: 'dev@sajiancatering.id',
        recoveryKey: 'SJC-DEV-XXXX-YYYY',
        newPassword: 'DevReset#2027',
        confirmPassword: 'DevReset#2027',
      });
    expect(badKeyReset.status).toBe(401);

    const devKeyReset = await request(app)
      .post('/api/auth/reset-password')
      .send({
        method: 'recovery_key',
        identifier: 'developer',
        recoveryKey: 'sjc-dev-9q4w-8r6t',
        newPassword: 'DevReset#2027',
        confirmPassword: 'DevReset#2027',
      });
    expect(devKeyReset.status).toBe(200);

    // 4) Brute-force lockout after 5 consecutive wrong passwords on kitchen
    for (let i = 0; i < 4; i += 1) {
      const failRes = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'dapur', password: 'WrongPassword9' });
      expect(failRes.status).toBe(401);
    }
    const fifthFail = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'dapur', password: 'WrongPassword9' });
    expect(fifthFail.status).toBe(429);

    // Even valid password blocked while locked
    const blockedGood = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'dapur', password: 'Dapur#5566' });
    expect(blockedGood.status).toBe(429);
  });
});
