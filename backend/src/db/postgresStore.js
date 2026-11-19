import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { hashPin } from '../security/auth.js';
import { normalizeIdentifier, normalizeRecoveryKey } from '../shared/passwordPolicy.js';
import { ROLE_META } from '../shared/rbac.js';
import {
  buildDefaultAppConfig,
  buildInitialOrders,
  DEFAULT_STAFF_ACCOUNTS,
  INITIAL_PACKAGES,
  INITIAL_STALLS,
} from '../shared/seedDefaults.js';
import { mapOrderRow, mapPackageRow, mapStallRow, parseJsonSafe } from './mappers.js';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTGRES_SCHEMA = fs.readFileSync(path.join(__dirname, 'schema.postgres.sql'), 'utf8');

let sharedPool = null;

function getOrCreatePool(databaseUrl) {
  if (sharedPool) return sharedPool;
  const isLocal = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
  sharedPool = new Pool({
    connectionString: databaseUrl,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
  return sharedPool;
}

export function createPostgresStore(databaseUrl, { seedDemoOrders = true } = {}) {
  const pool = getOrCreatePool(databaseUrl);
  let readyPromise = null;

  async function seedData({ preserveCredentials = true } = {}) {
    if (!preserveCredentials) {
      await pool.query('DELETE FROM staff_credentials');
    }
    const { rows: credRows } = await pool.query('SELECT COUNT(*)::int AS c FROM staff_credentials');
    if (credRows[0].c === 0) {
      for (const acc of Object.values(DEFAULT_STAFF_ACCOUNTS)) {
        await pool.query(
          `INSERT INTO staff_credentials (role, username, email, display_name, pin_hash, recovery_key_hash)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (role) DO NOTHING`,
          [
            acc.role,
            acc.username,
            acc.email,
            acc.displayName || ROLE_META[acc.role]?.label || acc.role,
            hashPin(acc.password),
            hashPin(normalizeRecoveryKey(acc.recoveryKey)),
          ]
        );
      }
    } else {
      for (const acc of Object.values(DEFAULT_STAFF_ACCOUNTS)) {
        await pool.query(
          `UPDATE staff_credentials
           SET username = COALESCE(username, $1),
               email = COALESCE(email, $2),
               recovery_key_hash = COALESCE(recovery_key_hash, $3)
           WHERE role = $4`,
          [acc.username, acc.email, hashPin(normalizeRecoveryKey(acc.recoveryKey)), acc.role]
        );
      }
    }

    const { rows: pkgRows } = await pool.query('SELECT COUNT(*)::int AS c FROM packages');
    if (pkgRows[0].c === 0) {
      for (const pkg of INITIAL_PACKAGES) {
        await upsertPackageAsync(pkg);
      }
    }

    const { rows: stallRows } = await pool.query('SELECT COUNT(*)::int AS c FROM stalls');
    if (stallRows[0].c === 0) {
      for (const stall of INITIAL_STALLS) {
        await pool.query(
          `INSERT INTO stalls (id, name, price, hpp, description, is_active)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
          [stall.id, stall.name, stall.price, stall.hpp, stall.description, stall.isActive !== false]
        );
      }
    }

    if (seedDemoOrders) {
      const { rows: orderRows } = await pool.query('SELECT COUNT(*)::int AS c FROM orders');
      if (orderRows[0].c === 0) {
        for (const order of buildInitialOrders()) {
          await createOrderAsync(order);
        }
      }
    }

    const { rows: cfgRows } = await pool.query('SELECT COUNT(*)::int AS c FROM app_config');
    if (cfgRows[0].c === 0) {
      const defaults = buildDefaultAppConfig();
      for (const [k, v] of Object.entries(defaults)) {
        await pool.query(
          `INSERT INTO app_config (key, value_json)
           VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
          [k, JSON.stringify(v)]
        );
      }
    }
  }

  async function upsertPackageAsync(pkg) {
    const words = (pkg.name || 'SAJIAN').toUpperCase().split(' ');
    const half = Math.ceil(words.length / 2);
    const titleLine1 = pkg.titleLine1 || (words.length <= 1 ? 'PAKET SPESIAL' : words.slice(0, half).join(' '));
    const titleLine2 = pkg.titleLine2 || (words.length <= 1 ? words[0] : words.slice(half).join(' '));

    const { rows } = await pool.query(
      `INSERT INTO packages (
        id, name, title_line_1, title_line_2, rank_label, category, plate_style, image_url, accent_tint,
        price, hpp, min_order, rating, likes, chef_name, chef_title, chef_quote, serving_note,
        allergens_json, equipment_json, video_duration, video_highlights_json, items_json, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, title_line_1 = EXCLUDED.title_line_1, title_line_2 = EXCLUDED.title_line_2,
        rank_label = EXCLUDED.rank_label, category = EXCLUDED.category, plate_style = EXCLUDED.plate_style,
        image_url = EXCLUDED.image_url, accent_tint = EXCLUDED.accent_tint, price = EXCLUDED.price, hpp = EXCLUDED.hpp,
        min_order = EXCLUDED.min_order, rating = EXCLUDED.rating, chef_name = EXCLUDED.chef_name,
        chef_title = EXCLUDED.chef_title, chef_quote = EXCLUDED.chef_quote, serving_note = EXCLUDED.serving_note,
        allergens_json = EXCLUDED.allergens_json, equipment_json = EXCLUDED.equipment_json,
        video_duration = EXCLUDED.video_duration, video_highlights_json = EXCLUDED.video_highlights_json,
        items_json = EXCLUDED.items_json, is_active = EXCLUDED.is_active, updated_at = NOW()
      RETURNING *`,
      [
        pkg.id,
        pkg.name,
        titleLine1,
        titleLine2,
        pkg.rankLabel || '#Baru Rilis',
        pkg.category,
        pkg.plateStyle || 'buffet',
        pkg.imageUrl || '',
        pkg.accentTint || '#064E3B',
        pkg.price,
        pkg.hpp,
        pkg.minOrder,
        pkg.rating || '4.9',
        pkg.likes ?? 0,
        pkg.chefName,
        pkg.chefTitle || 'Culinary Specialist',
        pkg.chefQuote || '',
        pkg.servingNote || '',
        JSON.stringify(pkg.allergens || []),
        JSON.stringify(pkg.equipment || []),
        pkg.videoDuration || '02:00',
        JSON.stringify(pkg.videoHighlights || []),
        JSON.stringify(pkg.items || []),
        pkg.isActive !== false,
      ]
    );
    return mapPackageRow(rows[0]);
  }

  async function createOrderAsync(order) {
    const { rows } = await pool.query(
      `INSERT INTO orders (
        id, customer_name, whatsapp, event_date, event_time, address, notes,
        package_id, package_name, package_price, package_hpp, pax, stalls_json,
        total_amount, dp_amount, dp_verified, status, kitchen_stage, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      ON CONFLICT (id) DO NOTHING RETURNING *`,
      [
        order.id,
        order.customerName,
        order.whatsapp,
        order.eventDate,
        order.eventTime,
        order.address,
        order.notes,
        order.packageId,
        order.packageName,
        order.packagePrice,
        order.packageHpp,
        order.pax,
        JSON.stringify(order.stalls || []),
        order.totalAmount,
        order.dpAmount,
        Boolean(order.dpVerified),
        order.status,
        order.kitchenStage || 'Persiapan Bahan',
        order.createdAt,
      ]
    );
    return mapOrderRow(rows[0]);
  }

  return {
    driver: 'postgres',
    async ping() {
      const t0 = Date.now();
      await pool.query('SELECT 1');
      return { ok: true, latencyMs: Date.now() - t0 };
    },
    async ensureReady() {
      if (!readyPromise) {
        readyPromise = (async () => {
          await pool.query(POSTGRES_SCHEMA);
          await seedData({ preserveCredentials: true });
        })();
      }
      return readyPromise;
    },
    async close() {
      readyPromise = null;
    },
    async getCredential(role) {
      const { rows } = await pool.query('SELECT * FROM staff_credentials WHERE role = $1', [role]);
      return rows[0] || null;
    },
    async getCredentialByIdentifier(identifier) {
      const key = normalizeIdentifier(identifier);
      if (!key) return null;
      const { rows } = await pool.query(
        'SELECT * FROM staff_credentials WHERE LOWER(email) = $1 OR LOWER(username) = $1',
        [key]
      );
      return rows[0] || null;
    },
    async listStaffAccounts() {
      const { rows } = await pool.query(
        `SELECT role, username, email, display_name AS "displayName",
                failed_attempts AS "failedAttempts", locked_until AS "lockedUntil", updated_at AS "updatedAt"
         FROM staff_credentials ORDER BY role ASC`
      );
      return rows;
    },
    async setCredential(role, newPassword) {
      const fallback = DEFAULT_STAFF_ACCOUNTS[role];
      await pool.query(
        `INSERT INTO staff_credentials (role, username, email, display_name, pin_hash, recovery_key_hash, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (role) DO UPDATE SET
           pin_hash = EXCLUDED.pin_hash,
           reset_code_hash = NULL,
           reset_expires_at = NULL,
           reset_attempts = 0,
           failed_attempts = 0,
           locked_until = NULL,
           updated_at = NOW()`,
        [
          role,
          fallback?.username || role,
          fallback?.email || `${role}@sajiancatering.id`,
          fallback?.displayName || ROLE_META[role]?.label || role,
          hashPin(newPassword),
          hashPin(normalizeRecoveryKey(fallback?.recoveryKey || `SJC-${role.toUpperCase()}-0000-0000`)),
        ]
      );
    },
    async updateRecoveryKey(role, newRecoveryKey) {
      await pool.query(
        'UPDATE staff_credentials SET recovery_key_hash = $1, updated_at = NOW() WHERE role = $2',
        [hashPin(normalizeRecoveryKey(newRecoveryKey)), role]
      );
    },
    async saveResetChallenge(role, codeHash, expiresAtIso) {
      await pool.query(
        `UPDATE staff_credentials
         SET reset_code_hash = $1, reset_expires_at = $2, reset_attempts = 0
         WHERE role = $3`,
        [codeHash, expiresAtIso, role]
      );
    },
    async incrementResetAttempts(role) {
      const { rows } = await pool.query(
        'UPDATE staff_credentials SET reset_attempts = reset_attempts + 1 WHERE role = $1 RETURNING reset_attempts AS attempts',
        [role]
      );
      return Number(rows[0]?.attempts || 0);
    },
    async clearResetChallenge(role) {
      await pool.query(
        'UPDATE staff_credentials SET reset_code_hash = NULL, reset_expires_at = NULL, reset_attempts = 0 WHERE role = $1',
        [role]
      );
    },
    async recordLoginFailure(role, maxAttempts = 5, lockMs = 120000) {
      const { rows } = await pool.query('SELECT failed_attempts FROM staff_credentials WHERE role = $1', [role]);
      const nextAttempts = Number(rows[0]?.failed_attempts || 0) + 1;
      const lockedUntil = nextAttempts >= maxAttempts ? new Date(Date.now() + lockMs).toISOString() : null;
      await pool.query(
        'UPDATE staff_credentials SET failed_attempts = $1, locked_until = $2 WHERE role = $3',
        [nextAttempts, lockedUntil, role]
      );
      return { failedAttempts: nextAttempts, lockedUntil };
    },
    async clearLoginFailures(role) {
      await pool.query('UPDATE staff_credentials SET failed_attempts = 0, locked_until = NULL WHERE role = $1', [role]);
    },
    async listPackages() {
      const { rows } = await pool.query('SELECT * FROM packages ORDER BY created_at ASC, id ASC');
      return rows.map(mapPackageRow);
    },
    async getPackage(id) {
      const { rows } = await pool.query('SELECT * FROM packages WHERE id = $1', [id]);
      return mapPackageRow(rows[0]);
    },
    async upsertPackage(pkg) {
      return upsertPackageAsync(pkg);
    },
    async deletePackage(id) {
      const res = await pool.query('DELETE FROM packages WHERE id = $1', [id]);
      return res.rowCount > 0;
    },
    async incrementPackageLike(id) {
      const { rows } = await pool.query(
        'UPDATE packages SET likes = likes + 1, updated_at = NOW() WHERE id = $1 RETURNING *',
        [id]
      );
      return mapPackageRow(rows[0]);
    },
    async listStalls() {
      const { rows } = await pool.query('SELECT * FROM stalls ORDER BY id ASC');
      return rows.map(mapStallRow);
    },
    async listOrders() {
      const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC, id DESC');
      return rows.map(mapOrderRow);
    },
    async getOrder(id) {
      const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
      return mapOrderRow(rows[0]);
    },
    async createOrder(order) {
      return createOrderAsync(order);
    },
    async updateOrder(id, patch) {
      const existing = await this.getOrder(id);
      if (!existing) return null;
      const merged = { ...existing, ...patch };
      const { rows } = await pool.query(
        `UPDATE orders SET
          event_date = $1, event_time = $2, notes = $3, dp_verified = $4,
          status = $5, kitchen_stage = $6, updated_at = NOW()
        WHERE id = $7 RETURNING *`,
        [
          merged.eventDate,
          merged.eventTime,
          merged.notes,
          Boolean(merged.dpVerified),
          merged.status,
          merged.kitchenStage,
          id,
        ]
      );
      return mapOrderRow(rows[0]);
    },
    async getAppConfig() {
      const { rows } = await pool.query('SELECT key, value_json FROM app_config');
      const base = buildDefaultAppConfig();
      for (const row of rows) {
        base[row.key] = parseJsonSafe(row.value_json, base[row.key]);
      }
      return base;
    },
    async setConfigEntries(entries) {
      for (const [k, v] of Object.entries(entries)) {
        if (v !== undefined) {
          await pool.query(
            `INSERT INTO app_config (key, value_json, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = NOW()`,
            [k, JSON.stringify(v)]
          );
        }
      }
      return this.getAppConfig();
    },
    async listAuditLogs(limit = 50) {
      const { rows } = await pool.query(
        'SELECT id, actor_role AS "actorRole", action, target_id AS "targetId", summary, created_at AS "createdAt" FROM audit_logs ORDER BY id DESC LIMIT $1',
        [limit]
      );
      return rows;
    },
    async addAuditLog({ actorRole, action, targetId, summary }) {
      await pool.query(
        'INSERT INTO audit_logs (actor_role, action, target_id, summary) VALUES ($1, $2, $3, $4)',
        [actorRole, action, targetId, summary]
      );
    },
    async resetToSeed() {
      await pool.query('TRUNCATE orders, packages, stalls, app_config, audit_logs RESTART IDENTITY');
      await seedData({ preserveCredentials: false });
      return this.getAppConfig();
    },
  };
}
