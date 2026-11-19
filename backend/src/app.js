import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import {
  stripOrderFinancials,
  stripPackageFinancials,
  stripStallFinancials,
} from './db/mappers.js';
import {
  createAuthMiddleware,
  generateOtpCode,
  generateRecoveryKey,
  hashSecret,
  signToken,
  verifyPin,
  verifySecret,
} from './security/auth.js';
import { sendPasswordResetEmail } from './security/mailer.js';
import {
  BusinessSettingsSchema,
  ChangePasswordSchema,
  ClientNoteSchema,
  CreateOrderSchema,
  DeveloperConfigSchema,
  DeveloperResetPasswordSchema,
  ForgotPasswordSchema,
  KitchenStageSchema,
  LoginSchema,
  OrderAdminPatchSchema,
  PackageUpsertSchema,
  ResetPasswordSchema,
  RotateRecoveryKeySchema,
  VerifyResetCodeSchema,
} from './security/schemas.js';
import {
  aggregateKitchenSheet,
  computeCalendarSlots,
  computeKpiStats,
  phonesMatch,
} from './services/cateringService.js';
import { maskEmail, normalizeRecoveryKey } from './shared/passwordPolicy.js';
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
     AUTH & PASSWORD RECOVERY ROUTES
  ============================================================ */
  function toPublicAccount(cred) {
    if (!cred) return null;
    return {
      role: cred.role,
      username: cred.username,
      email: cred.email,
      displayName: cred.display_name || ROLE_META[cred.role]?.label || cred.role,
      updatedAt: cred.updated_at,
    };
  }

  app.post('/api/auth/login', async (req, res, next) => {
    try {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }
      const { identifier, password, role: requestedRole, pin, rememberMe } = parsed.data;
      const secretInput = password ?? pin ?? '';

      const cred = identifier
        ? await store.getCredentialByIdentifier(identifier)
        : requestedRole
          ? await store.getCredential(requestedRole)
          : null;

      if (!cred) {
        return res.status(401).json({ error: 'Email/username atau password tidak valid.' });
      }

      if (requestedRole && cred.role !== requestedRole) {
        return res.status(403).json({
          error: `Akun ini terdaftar sebagai ${ROLE_META[cred.role]?.shortLabel || cred.role}, bukan ${ROLE_META[requestedRole]?.shortLabel || requestedRole}. Pilih tab role yang sesuai.`,
        });
      }

      if (cred.locked_until) {
        const lockEndsAt = new Date(cred.locked_until).getTime();
        if (lockEndsAt > Date.now()) {
          const remainingSec = Math.ceil((lockEndsAt - Date.now()) / 1000);
          return res.status(429).json({
            error: `Akun dikunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam ${remainingSec} detik atau gunakan Lupa Password.`,
            lockedUntil: cred.locked_until,
            remainingSeconds: remainingSec,
          });
        }
        await store.clearLoginFailures(cred.role);
      }

      if (!verifyPin(secretInput, cred.pin_hash)) {
        const maxAttempts = config.maxLoginAttempts || 5;
        const lockMs = (config.lockoutMinutes || 2) * 60 * 1000;
        const failure = await store.recordLoginFailure(cred.role, maxAttempts, lockMs);
        const remaining = Math.max(0, maxAttempts - failure.failedAttempts);
        if (failure.lockedUntil) {
          return res.status(429).json({
            error: `Terlalu banyak percobaan gagal (${maxAttempts}x). Akun dikunci sementara selama ${config.lockoutMinutes || 2} menit.`,
            lockedUntil: failure.lockedUntil,
            remainingSeconds: Math.ceil(lockMs / 1000),
          });
        }
        return res.status(401).json({
          error: `Password tidak valid. Sisa ${remaining} percobaan sebelum akun dikunci sementara.`,
          remainingAttempts: remaining,
        });
      }

      await store.clearLoginFailures(cred.role);
      const scopes = getRoleScopes(cred.role);
      const ttl = rememberMe ? config.rememberTokenTtlSeconds : config.tokenTtlSeconds;
      const token = signToken(
        { sub: cred.role, role: cred.role, username: cred.username, email: cred.email, scopes },
        config.jwtSecret,
        ttl
      );
      await store.addAuditLog({
        actorRole: cred.role,
        action: 'AUTH_LOGIN',
        targetId: cred.username || cred.role,
        summary: `Login berhasil sebagai ${cred.display_name || ROLE_META[cred.role]?.label || cred.role}`,
      });
      return res.json({
        token,
        role: cred.role,
        account: toPublicAccount(cred),
        scopes,
        expiresIn: ttl,
      });
    } catch (err) {
      return next(err);
    }
  });

  app.get('/api/auth/me', requireAuth, async (req, res, next) => {
    try {
      const cred = await store.getCredential(req.user.role);
      res.json({
        role: req.user.role,
        account: toPublicAccount(cred),
        scopes: getRoleScopes(req.user.role),
        exp: req.user.exp,
      });
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/auth/accounts', requireAuth, async (req, res, next) => {
    try {
      const selfCred = await store.getCredential(req.user.role);
      const accounts =
        req.user.role === ROLES.DEVELOPER
          ? await store.listStaffAccounts()
          : selfCred
            ? [toPublicAccount(selfCred)]
            : [];
      return res.json({ account: toPublicAccount(selfCred), accounts });
    } catch (err) {
      return next(err);
    }
  });

  app.post('/api/auth/forgot-password', async (req, res, next) => {
    try {
      const parsed = ForgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }
      const { identifier, role: requestedRole } = parsed.data;
      const cred = await store.getCredentialByIdentifier(identifier);

      if (!cred || (requestedRole && cred.role !== requestedRole)) {
        if (config.isProd) {
          return res.json({
            ok: true,
            message: 'Jika akun terdaftar, kode OTP 6-digit telah dikirim ke email pemulihan Anda.',
            expiresInSeconds: (config.resetOtpTtlMinutes || 10) * 60,
          });
        }
        return res.status(404).json({ error: 'Akun dengan email atau username tersebut tidak ditemukan.' });
      }

      const otpCode = generateOtpCode();
      const ttlMinutes = config.resetOtpTtlMinutes || 10;
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
      await store.saveResetChallenge(cred.role, hashSecret(otpCode), expiresAt);

      const delivery = await sendPasswordResetEmail({
        config,
        toEmail: cred.email,
        displayName: cred.display_name || ROLE_META[cred.role]?.label || cred.role,
        otpCode,
        ttlMinutes,
      });

      await store.addAuditLog({
        actorRole: cred.role,
        action: 'AUTH_RESET_REQUESTED',
        targetId: cred.username || cred.role,
        summary: `Permintaan kode OTP lupa password dibuat (${delivery.provider})`,
      });

      return res.json({
        ok: true,
        message: delivery.delivered
          ? `Kode OTP 6-digit telah dikirim ke ${maskEmail(cred.email)}.`
          : `Kode OTP 6-digit telah dibuat untuk ${maskEmail(cred.email)}.`,
        maskedEmail: maskEmail(cred.email),
        role: cred.role,
        expiresAt,
        expiresInSeconds: ttlMinutes * 60,
        deliveryMode: delivery.provider,
        ...(delivery.previewCode ? { previewCode: delivery.previewCode } : {}),
      });
    } catch (err) {
      return next(err);
    }
  });

  app.post('/api/auth/verify-reset-code', async (req, res, next) => {
    try {
      const parsed = VerifyResetCodeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }
      const { identifier, code } = parsed.data;
      const cred = await store.getCredentialByIdentifier(identifier);
      if (!cred || !cred.reset_code_hash || !cred.reset_expires_at) {
        return res.status(400).json({ error: 'Permintaan reset tidak ditemukan atau sudah kedaluwarsa.' });
      }
      if (new Date(cred.reset_expires_at).getTime() < Date.now()) {
        await store.clearResetChallenge(cred.role);
        return res.status(400).json({ error: 'Kode OTP telah kedaluwarsa. Silakan minta kode baru.' });
      }
      if (Number(cred.reset_attempts || 0) >= 5) {
        await store.clearResetChallenge(cred.role);
        return res.status(429).json({ error: 'Terlalu banyak percobaan OTP salah. Silakan minta kode baru.' });
      }
      if (!verifySecret(code, cred.reset_code_hash)) {
        const attempts = await store.incrementResetAttempts(cred.role);
        const left = Math.max(0, 5 - attempts);
        return res.status(400).json({
          error: left > 0 ? `Kode OTP tidak sesuai. Sisa ${left} percobaan.` : 'Batas percobaan OTP habis. Minta kode baru.',
        });
      }
      return res.json({
        ok: true,
        role: cred.role,
        maskedEmail: maskEmail(cred.email),
      });
    } catch (err) {
      return next(err);
    }
  });

  app.post('/api/auth/reset-password', async (req, res, next) => {
    try {
      const parsed = ResetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }
      const { method, identifier, code, recoveryKey, newPassword } = parsed.data;
      const cred = await store.getCredentialByIdentifier(identifier);
      if (!cred) {
        return res.status(400).json({ error: 'Verifikasi gagal. Pastikan email/username dan kredensial pemulihan benar.' });
      }

      if (method === 'otp') {
        if (!cred.reset_code_hash || !cred.reset_expires_at) {
          return res.status(400).json({ error: 'Kode OTP belum diminta atau sudah kedaluwarsa.' });
        }
        if (new Date(cred.reset_expires_at).getTime() < Date.now()) {
          await store.clearResetChallenge(cred.role);
          return res.status(400).json({ error: 'Kode OTP telah kedaluwarsa. Silakan minta kode baru.' });
        }
        if (Number(cred.reset_attempts || 0) >= 5) {
          await store.clearResetChallenge(cred.role);
          return res.status(429).json({ error: 'Terlalu banyak percobaan OTP salah. Silakan minta kode baru.' });
        }
        if (!verifySecret(code, cred.reset_code_hash)) {
          await store.incrementResetAttempts(cred.role);
          return res.status(400).json({ error: 'Kode OTP tidak valid.' });
        }
      } else {
        const normalizedKey = normalizeRecoveryKey(recoveryKey);
        if (!cred.recovery_key_hash || !verifySecret(normalizedKey, cred.recovery_key_hash)) {
          return res.status(401).json({ error: 'Master Recovery Key tidak cocok dengan akun tersebut.' });
        }
      }

      await store.setCredential(cred.role, newPassword);
      await store.addAuditLog({
        actorRole: cred.role,
        action: 'AUTH_PASSWORD_RESET',
        targetId: cred.username || cred.role,
        summary: `Password akun ${cred.role} berhasil direset melalui metode ${method === 'otp' ? 'Email OTP' : 'Master Recovery Key'}`,
      });

      return res.json({
        ok: true,
        role: cred.role,
        email: cred.email,
        message: 'Password baru berhasil disimpan. Silakan login menggunakan password baru Anda.',
      });
    } catch (err) {
      return next(err);
    }
  });

  app.post('/api/auth/change-password', requireAuth, async (req, res, next) => {
    try {
      const parsed = ChangePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }
      const { currentPassword, newPassword } = parsed.data;
      const cred = await store.getCredential(req.user.role);
      if (!cred || !verifyPin(currentPassword, cred.pin_hash)) {
        return res.status(401).json({ error: 'Password saat ini tidak sesuai.' });
      }

      await store.setCredential(req.user.role, newPassword);
      await store.addAuditLog({
        actorRole: req.user.role,
        action: 'AUTH_PASSWORD_CHANGED',
        targetId: cred.username || req.user.role,
        summary: `Akun ${req.user.role} memperbarui password keamanan secara mandiri`,
      });

      return res.json({ ok: true, message: 'Password berhasil diperbarui.' });
    } catch (err) {
      return next(err);
    }
  });

  app.post('/api/auth/recovery-key/rotate', requireAuth, async (req, res, next) => {
    try {
      const parsed = RotateRecoveryKeySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }
      const { currentPassword, targetRole } = parsed.data;
      const actorCred = await store.getCredential(req.user.role);
      if (!actorCred || !verifyPin(currentPassword, actorCred.pin_hash)) {
        return res.status(401).json({ error: 'Verifikasi password Anda gagal.' });
      }

      const roleToRotate = targetRole || req.user.role;
      if (roleToRotate !== req.user.role && req.user.role !== ROLES.DEVELOPER) {
        return res.status(403).json({ error: 'Hanya Pengembang yang dapat merotasi Recovery Key akun lain.' });
      }

      const newRecoveryKey = generateRecoveryKey(roleToRotate);
      await store.updateRecoveryKey(roleToRotate, newRecoveryKey);
      await store.addAuditLog({
        actorRole: req.user.role,
        action: 'AUTH_RECOVERY_KEY_ROTATED',
        targetId: roleToRotate,
        summary: `Master Recovery Key untuk akun ${roleToRotate} diperbarui`,
      });

      return res.json({
        ok: true,
        role: roleToRotate,
        recoveryKey: newRecoveryKey,
        message: 'Master Recovery Key baru berhasil dibuat. Simpan di tempat yang aman.',
      });
    } catch (err) {
      return next(err);
    }
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
      const [configData, packages, stalls, orders, auditLogs, staffAccounts] = await Promise.all([
        store.getAppConfig(),
        store.listPackages(),
        store.listStalls(),
        store.listOrders(),
        store.listAuditLogs(50),
        store.listStaffAccounts(),
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
        staffAccounts,
      });
    } catch (err) {
      return next(err);
    }
  });

  app.post(
    '/api/developer/accounts/:role/reset-password',
    requireAuth,
    requireScope(SCOPES.DEV_RBAC_PIN_EDIT),
    async (req, res, next) => {
      try {
        const targetRole = req.params.role;
        if (![ROLES.KITCHEN, ROLES.ADMIN, ROLES.DEVELOPER].includes(targetRole)) {
          return res.status(400).json({ error: 'Role akun tidak valid.' });
        }
        const parsed = DeveloperResetPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ error: formatZodError(parsed.error) });
        }
        await store.setCredential(targetRole, parsed.data.newPassword);
        await store.addAuditLog({
          actorRole: req.user.role,
          action: 'DEV_RESET_STAFF_PASSWORD',
          targetId: targetRole,
          summary: `Pengembang mereset password akun ${targetRole}`,
        });
        return res.json({ ok: true, role: targetRole, message: `Password akun ${targetRole} berhasil diperbarui.` });
      } catch (err) {
        return next(err);
      }
    }
  );

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
