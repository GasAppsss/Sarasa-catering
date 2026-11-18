import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import {
  stripOrderFinancials,
  stripPackageFinancials,
  stripStallFinancials,
} from './db/mappers.js';
import { createAuthMiddleware, signToken, verifyPin } from './security/auth.js';
import {
  BusinessSettingsSchema,
  ClientNoteSchema,
  CreateOrderSchema,
  DeveloperConfigSchema,
  KitchenStageSchema,
  LoginSchema,
  OrderAdminPatchSchema,
  PackageUpsertSchema,
} from './security/schemas.js';
import {
  aggregateKitchenSheet,
  computeCalendarSlots,
  computeKpiStats,
  phonesMatch,
} from './services/cateringService.js';
import { getRoleScopes, ROLE_META, ROLE_SCOPES, ROLES, SCOPES } from './shared/rbac.js';
import { getDateOffsetIso } from './shared/seedDefaults.js';

function formatZodError(error) {
  return error.issues.map((issue) => `${issue.path.join('.') || 'input'}: ${issue.message}`).join('; ');
}

export function createApp({ config, store }) {
  const app = express();
  const { requireAuth, requireScope } = createAuthMiddleware(config.jwtSecret);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Origin not allowed by CORS'));
      },
      credentials: false,
    })
  );
  app.use(express.json({ limit: '512kb' }));

  // Ensure DB schema and seed exist (serverless cold-start safe).
  app.use(async (_req, _res, next) => {
    try {
      await store.ensureReady();
      next();
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'sajian-catering-api',
      driver: store.driver,
      timestamp: new Date().toISOString(),
    });
  });

  /* ============================================================
     AUTH ROUTES
  ============================================================ */
  app.post('/api/auth/login', async (req, res, next) => {
    try {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }
      const { role, pin } = parsed.data;
      const cred = await store.getCredential(role);
      if (!cred || !verifyPin(pin, cred.pin_hash)) {
        return res.status(401).json({ error: 'PIN akses tidak valid untuk role tersebut.' });
      }
      const scopes = getRoleScopes(role);
      const token = signToken({ sub: role, role, scopes }, config.jwtSecret, config.tokenTtlSeconds);
      await store.addAuditLog({
        actorRole: role,
        action: 'AUTH_LOGIN',
        targetId: role,
        summary: `Login berhasil sebagai ${ROLE_META[role]?.label || role}`,
      });
      return res.json({
        token,
        role,
        scopes,
        expiresIn: config.tokenTtlSeconds,
      });
    } catch (err) {
      return next(err);
    }
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({
      role: req.user.role,
      scopes: getRoleScopes(req.user.role),
      exp: req.user.exp,
    });
  });

  /* ============================================================
     PUBLIC / CLIENT SHOWCASE ROUTES (NO HPP, NO OTHER USERS PII)
  ============================================================ */
  app.get('/api/public/bootstrap', async (_req, res, next) => {
    try {
      const [appConfig, packages, stalls, orders] = await Promise.all([
        store.getAppConfig(),
        store.listPackages(),
        store.listStalls(),
        store.listOrders(),
      ]);

      const activePackages = packages.filter((p) => p.isActive).map(stripPackageFinancials);
      const activeStalls = stalls.filter((s) => s.isActive).map(stripStallFinancials);
      const calendarSlots = computeCalendarSlots(orders, appConfig.business, 14);

      res.json({
        config: {
          brand: appConfig.brand,
          business: appConfig.business,
          themeTokens: appConfig.themeTokens,
          featureFlags: appConfig.featureFlags,
          companyProfile: appConfig.companyProfile,
          testimonials: appConfig.testimonials,
          faq: appConfig.faq,
          terms: appConfig.terms,
        },
        packages: activePackages,
        stalls: activeStalls,
        calendarSlots,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/packages/:id/like', async (req, res, next) => {
    try {
      const updated = await store.incrementPackageLike(req.params.id);
      if (!updated) {
        return res.status(404).json({ error: 'Paket tidak ditemukan.' });
      }
      return res.json({ package: stripPackageFinancials(updated) });
    } catch (err) {
      return next(err);
    }
  });

  app.post('/api/orders', async (req, res, next) => {
    try {
      const parsed = CreateOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }
      const data = parsed.data;
      const [appConfig, pkg, allStalls, existingOrders] = await Promise.all([
        store.getAppConfig(),
        store.getPackage(data.packageId),
        store.listStalls(),
        store.listOrders(),
      ]);

      if (!pkg || !pkg.isActive) {
        return res.status(404).json({ error: 'Paket catering tidak tersedia.' });
      }
      if (data.pax < pkg.minOrder) {
        return res.status(400).json({
          error: `Minimal pemesanan untuk ${pkg.name} adalah ${pkg.minOrder} pax.`,
        });
      }

      const blocked = new Set(appConfig.business?.blockedDates || []);
      const dailyMaxPax = Number(appConfig.business?.dailyMaxPax) || 600;
      const bookedOnDate = existingOrders
        .filter((o) => o.eventDate === data.eventDate)
        .reduce((sum, o) => sum + Number(o.pax || 0), 0);

      if (blocked.has(data.eventDate) || bookedOnDate >= dailyMaxPax) {
        return res.status(409).json({
          error: `Jadwal tanggal ${data.eventDate} sudah penuh atau ditutup oleh dapur.`,
        });
      }
      if (bookedOnDate + data.pax > dailyMaxPax) {
        return res.status(409).json({
          error: `Sisa kapasitas dapur tanggal ${data.eventDate} tinggal ${Math.max(0, dailyMaxPax - bookedOnDate)} pax.`,
        });
      }

      // Compute pricing authoritatively on server from database prices.
      const mainSubtotal = pkg.price * data.pax;
      let stallsSubtotal = 0;
      const resolvedStalls = [];
      for (const reqStall of data.stalls) {
        const dbStall = allStalls.find((s) => s.id === reqStall.id && s.isActive);
        if (!dbStall) {
          return res.status(400).json({ error: `Pondokan "${reqStall.id}" tidak tersedia.` });
        }
        stallsSubtotal += dbStall.price * reqStall.pax;
        resolvedStalls.push({
          id: dbStall.id,
          name: dbStall.name,
          price: dbStall.price,
          hpp: dbStall.hpp,
          pax: reqStall.pax,
        });
      }

      const totalAmount = mainSubtotal + stallsSubtotal;
      const dpPercent = Number(appConfig.business?.dpPercent) || 50;
      const dpAmount = Math.round((totalAmount * dpPercent) / 100);
      const prefix = appConfig.brand?.orderPrefix || 'SJC';
      const nextNum = String(existingOrders.length + 1).padStart(3, '0');
      const year = new Date().getFullYear();

      const created = await store.createOrder({
        id: `${prefix}-${year}-${nextNum}`,
        customerName: data.customerName,
        whatsapp: data.whatsapp,
        eventDate: data.eventDate,
        eventTime: data.eventTime,
        address: data.address,
        notes: data.notes || 'Tidak ada catatan tambahan.',
        packageId: pkg.id,
        packageName: pkg.name,
        packagePrice: pkg.price,
        packageHpp: pkg.hpp,
        pax: data.pax,
        stalls: resolvedStalls,
        totalAmount,
        dpAmount,
        dpVerified: false,
        status: 'Menunggu DP',
        kitchenStage: 'Persiapan Bahan',
        createdAt: getDateOffsetIso(0),
      });

      await store.addAuditLog({
        actorRole: ROLES.CLIENT,
        action: 'ORDER_CREATED',
        targetId: created.id,
        summary: `Pesanan baru ${created.id} (${created.packageName} • ${created.pax} pax)`,
      });

      return res.status(201).json({ order: stripOrderFinancials(created) });
    } catch (err) {
      return next(err);
    }
  });

  app.get('/api/orders/track', async (req, res, next) => {
    try {
      const orderId = String(req.query.orderId || '').trim().toUpperCase();
      const whatsapp = String(req.query.whatsapp || '').trim();
      if (!orderId || !whatsapp) {
        return res.status(400).json({ error: 'Masukkan Kode Pesanan dan Nomor WhatsApp untuk melacak pesanan.' });
      }
      const order = await store.getOrder(orderId);
      if (!order || !phonesMatch(order.whatsapp, whatsapp)) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan atau nomor WhatsApp tidak cocok.' });
      }
      return res.json({ order: stripOrderFinancials(order) });
    } catch (err) {
      return next(err);
    }
  });

  app.patch('/api/orders/:id/client-note', async (req, res, next) => {
    try {
      const parsed = ClientNoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }
      const order = await store.getOrder(req.params.id);
      if (!order || !phonesMatch(order.whatsapp, parsed.data.whatsapp)) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan atau verifikasi WhatsApp tidak sesuai.' });
      }
      const updated = await store.updateOrder(order.id, { notes: parsed.data.notes });
      await store.addAuditLog({
        actorRole: ROLES.CLIENT,
        action: 'CLIENT_NOTE_UPDATED',
        targetId: order.id,
        summary: `Klien memperbarui catatan acara pada ${order.id}`,
      });
      return res.json({ order: stripOrderFinancials(updated) });
    } catch (err) {
      return next(err);
    }
  });

  /* ============================================================
     KITCHEN ADMIN POV ROUTES (STRICTLY STRIPPED OF HPP/MARGINS)
  ============================================================ */
  app.get('/api/kitchen/sheet', requireAuth, requireScope(SCOPES.KITCHEN_SHEET_VIEW), async (req, res, next) => {
    try {
      const [orders, packages, appConfig] = await Promise.all([
        store.listOrders(),
        store.listPackages(),
        store.getAppConfig(),
      ]);
      const availableDates = Array.from(new Set(orders.map((o) => o.eventDate))).sort();
      const targetDate = String(req.query.date || availableDates[0] || getDateOffsetIso(3));
      const sheet = aggregateKitchenSheet(orders, packages, targetDate);

      return res.json({
        availableDates,
        dailyMaxPax: appConfig.business?.dailyMaxPax || 600,
        sheet: {
          ...sheet,
          ordersOnDate: sheet.ordersOnDate.map((o) => stripOrderFinancials(o, { includePrices: false })),
        },
      });
    } catch (err) {
      return next(err);
    }
  });

  app.patch('/api/kitchen/orders/:id/stage', requireAuth, requireScope(SCOPES.KITCHEN_STAGE_UPDATE), async (req, res, next) => {
    try {
      const parsed = KitchenStageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }
      const existing = await store.getOrder(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
      }
      const statusPatch =
        parsed.data.kitchenStage === 'Siap Kirim' && existing.status === 'Diproses Dapur'
          ? { kitchenStage: parsed.data.kitchenStage, status: 'Dikirim' }
          : parsed.data.kitchenStage === 'Sedang Dimasak' && existing.status === 'DP Lunas'
            ? { kitchenStage: parsed.data.kitchenStage, status: 'Diproses Dapur' }
            : { kitchenStage: parsed.data.kitchenStage };

      const updated = await store.updateOrder(existing.id, statusPatch);
      await store.addAuditLog({
        actorRole: req.user.role,
        action: 'KITCHEN_STAGE_UPDATED',
        targetId: existing.id,
        summary: `Tahap dapur ${existing.id} -> ${parsed.data.kitchenStage}`,
      });
      return res.json({ order: stripOrderFinancials(updated, { includePrices: false }) });
    } catch (err) {
      return next(err);
    }
  });

  /* ============================================================
     BUSINESS ADMINISTRATOR POV ROUTES
  ============================================================ */
  app.get('/api/admin/dashboard', requireAuth, requireScope(SCOPES.ADMIN_ANALYTICS_VIEW), async (_req, res, next) => {
    try {
      const [orders, packages, stalls, appConfig, auditLogs] = await Promise.all([
        store.listOrders(),
        store.listPackages(),
        store.listStalls(),
        store.getAppConfig(),
        store.listAuditLogs(30),
      ]);
      return res.json({
        kpis: computeKpiStats(orders),
        orders,
        packages,
        stalls,
        config: appConfig,
        auditLogs,
      });
    } catch (err) {
      return next(err);
    }
  });

  app.patch('/api/admin/orders/:id', requireAuth, requireScope(SCOPES.ORDER_MANAGE_ALL), async (req, res, next) => {
    try {
      const parsed = OrderAdminPatchSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }
      const updated = await store.updateOrder(req.params.id, parsed.data);
      if (!updated) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
      }
      await store.addAuditLog({
        actorRole: req.user.role,
        action: 'ORDER_UPDATED',
        targetId: updated.id,
        summary: `Admin memperbarui ${updated.id} (status: ${updated.status})`,
      });
      return res.json({ order: updated });
    } catch (err) {
      return next(err);
    }
  });

  app.post('/api/admin/packages', requireAuth, requireScope(SCOPES.CATALOG_MANAGE), async (req, res, next) => {
    try {
      const parsed = PackageUpsertSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }
      const id = parsed.data.id || `pkg-${Date.now()}`;
      const saved = await store.upsertPackage({ ...parsed.data, id });
      await store.addAuditLog({
        actorRole: req.user.role,
        action: 'PACKAGE_SAVED',
        targetId: saved.id,
        summary: `Paket "${saved.name}" disimpan ke katalog`,
      });
      return res.status(201).json({ package: saved });
    } catch (err) {
      return next(err);
    }
  });

  app.put('/api/admin/packages/:id', requireAuth, requireScope(SCOPES.CATALOG_MANAGE), async (req, res, next) => {
    try {
      const parsed = PackageUpsertSchema.safeParse({ ...req.body, id: req.params.id });
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }
      const saved = await store.upsertPackage({ ...parsed.data, id: req.params.id });
      await store.addAuditLog({
        actorRole: req.user.role,
        action: 'PACKAGE_UPDATED',
        targetId: saved.id,
        summary: `Paket "${saved.name}" diperbarui`,
      });
      return res.json({ package: saved });
    } catch (err) {
      return next(err);
    }
  });

  app.delete('/api/admin/packages/:id', requireAuth, requireScope(SCOPES.CATALOG_MANAGE), async (req, res, next) => {
    try {
      const deleted = await store.deletePackage(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Paket tidak ditemukan.' });
      }
      await store.addAuditLog({
        actorRole: req.user.role,
        action: 'PACKAGE_DELETED',
        targetId: req.params.id,
        summary: `Paket ${req.params.id} dihapus dari katalog`,
      });
      return res.json({ ok: true });
    } catch (err) {
      return next(err);
    }
  });

  app.put('/api/admin/settings', requireAuth, requireScope(SCOPES.BUSINESS_SETTINGS_EDIT), async (req, res, next) => {
    try {
      const parsed = BusinessSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }
      const nextConfig = await store.setConfigEntries({
        business: parsed.data.business,
        faq: parsed.data.faq,
        terms: parsed.data.terms,
        companyProfile: parsed.data.companyProfile,
      });
      await store.addAuditLog({
        actorRole: req.user.role,
        action: 'BUSINESS_SETTINGS_UPDATED',
        targetId: 'business',
        summary: 'Administrator memperbarui pengaturan operasional & profil bisnis',
      });
      return res.json({ config: nextConfig });
    } catch (err) {
      return next(err);
    }
  });

  /* ============================================================
     DEVELOPER-ONLY SETTINGS POV ROUTES
  ============================================================ */
  app.get('/api/developer/state', requireAuth, requireScope(SCOPES.DEV_SYSTEM_JSON_IO), async (_req, res, next) => {
    try {
      const [configData, packages, stalls, orders, auditLogs] = await Promise.all([
        store.getAppConfig(),
        store.listPackages(),
        store.listStalls(),
        store.listOrders(),
        store.listAuditLogs(50),
      ]);
      return res.json({
        driver: store.driver,
        rbacMatrix: ROLE_SCOPES,
        rolesMeta: ROLE_META,
        config: configData,
        packages,
        stalls,
        orders,
        auditLogs,
      });
    } catch (err) {
      return next(err);
    }
  });

  app.put('/api/developer/config', requireAuth, requireScope(SCOPES.DEV_THEME_TOKENS_EDIT), async (req, res, next) => {
    try {
      const parsed = DeveloperConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }
      const { brand, themeTokens, featureFlags, rolePins } = parsed.data;
      const nextConfig = await store.setConfigEntries({ brand, themeTokens, featureFlags });

      if (rolePins) {
        for (const roleKey of [ROLES.KITCHEN, ROLES.ADMIN, ROLES.DEVELOPER]) {
          if (rolePins[roleKey]) {
            await store.setCredential(roleKey, rolePins[roleKey]);
          }
        }
      }

      await store.addAuditLog({
        actorRole: req.user.role,
        action: 'DEVELOPER_CONFIG_UPDATED',
        targetId: 'system',
        summary: 'Pengembang memperbarui konfigurasi tema/flags/PIN sistem',
      });
      return res.json({ config: nextConfig });
    } catch (err) {
      return next(err);
    }
  });

  app.post('/api/developer/reset', requireAuth, requireScope(SCOPES.DEV_SYSTEM_JSON_IO), async (req, res, next) => {
    try {
      const configData = await store.resetToSeed();
      await store.addAuditLog({
        actorRole: req.user.role,
        action: 'SYSTEM_FACTORY_RESET',
        targetId: 'system',
        summary: 'Pengembang mengembalikan seluruh data & konfigurasi ke default awal',
      });
      return res.json({ ok: true, config: configData });
    } catch (err) {
      return next(err);
    }
  });

  app.use((err, _req, res, _next) => {
    if (err.message === 'Origin not allowed by CORS') {
      return res.status(403).json({ error: 'CORS origin tidak diizinkan.' });
    }
    return res.status(500).json({ error: 'Terjadi kesalahan internal pada server.' });
  });

  return app;
}
