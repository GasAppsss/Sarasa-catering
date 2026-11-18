import fs from 'node:fs';
import path from 'node:path';
import { hashPin } from '../security/auth.js';

const { DatabaseSync } = process.getBuiltinModule('node:sqlite');
import { ROLE_META } from '../shared/rbac.js';
import {
  buildDefaultAppConfig,
  buildInitialOrders,
  DEFAULT_ROLE_PINS,
  INITIAL_PACKAGES,
  INITIAL_STALLS,
} from '../shared/seedDefaults.js';
import { mapOrderRow, mapPackageRow, mapStallRow, parseJsonSafe } from './mappers.js';

const SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS staff_credentials (
  role TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title_line_1 TEXT NOT NULL,
  title_line_2 TEXT NOT NULL,
  rank_label TEXT NOT NULL,
  category TEXT NOT NULL,
  plate_style TEXT NOT NULL,
  accent_tint TEXT NOT NULL,
  price INTEGER NOT NULL,
  hpp INTEGER NOT NULL,
  min_order INTEGER NOT NULL,
  rating TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  chef_name TEXT NOT NULL,
  chef_title TEXT NOT NULL,
  chef_quote TEXT NOT NULL,
  serving_note TEXT NOT NULL,
  allergens_json TEXT NOT NULL,
  equipment_json TEXT NOT NULL,
  video_duration TEXT NOT NULL,
  video_highlights_json TEXT NOT NULL,
  items_json TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stalls (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  hpp INTEGER NOT NULL,
  description TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL,
  address TEXT NOT NULL,
  notes TEXT NOT NULL,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  package_price INTEGER NOT NULL,
  package_hpp INTEGER NOT NULL,
  pax INTEGER NOT NULL,
  stalls_json TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  dp_amount INTEGER NOT NULL,
  dp_verified INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  kitchen_stage TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_event_date ON orders(event_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_whatsapp ON orders(whatsapp);

CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

export function createSqliteStore(sqlitePath) {
  let db = null;
  let readyPromise = null;

  function ensureOpen() {
    if (db) return db;
    if (sqlitePath !== ':memory:') {
      fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
    }
    db = new DatabaseSync(sqlitePath);
    if (sqlitePath !== ':memory:') {
      db.exec('PRAGMA journal_mode = WAL;');
    }
    db.exec(SQLITE_SCHEMA);
    return db;
  }

  function seedData({ preserveCredentials = true } = {}) {
    const conn = ensureOpen();
    const nowIso = new Date().toISOString();

    const credCount = conn.prepare('SELECT COUNT(*) AS c FROM staff_credentials').get().c;
    if (!preserveCredentials || credCount === 0) {
      const insertCred = conn.prepare(
        'INSERT OR REPLACE INTO staff_credentials (role, display_name, pin_hash, updated_at) VALUES (?, ?, ?, ?)'
      );
      for (const [role, pin] of Object.entries(DEFAULT_ROLE_PINS)) {
        insertCred.run(role, ROLE_META[role]?.label || role, hashPin(pin), nowIso);
      }
    }

    const pkgCount = conn.prepare('SELECT COUNT(*) AS c FROM packages').get().c;
    if (pkgCount === 0) {
      for (const pkg of INITIAL_PACKAGES) {
        upsertPackageSync(pkg);
      }
    }

    const stallCount = conn.prepare('SELECT COUNT(*) AS c FROM stalls').get().c;
    if (stallCount === 0) {
      const insertStall = conn.prepare(
        'INSERT OR REPLACE INTO stalls (id, name, price, hpp, description, is_active) VALUES (?, ?, ?, ?, ?, ?)'
      );
      for (const stall of INITIAL_STALLS) {
        insertStall.run(stall.id, stall.name, stall.price, stall.hpp, stall.description, stall.isActive ? 1 : 0);
      }
    }

    const orderCount = conn.prepare('SELECT COUNT(*) AS c FROM orders').get().c;
    if (orderCount === 0) {
      for (const order of buildInitialOrders()) {
        createOrderSync(order);
      }
    }

    const cfgCount = conn.prepare('SELECT COUNT(*) AS c FROM app_config').get().c;
    if (cfgCount === 0) {
      const defaults = buildDefaultAppConfig();
      const insertCfg = conn.prepare(
        'INSERT OR REPLACE INTO app_config (key, value_json, updated_at) VALUES (?, ?, ?)'
      );
      for (const [k, v] of Object.entries(defaults)) {
        insertCfg.run(k, JSON.stringify(v), nowIso);
      }
    }
  }

  function upsertPackageSync(pkg) {
    const conn = ensureOpen();
    const nowIso = new Date().toISOString();
    const words = (pkg.name || 'SAJIAN').toUpperCase().split(' ');
    const half = Math.ceil(words.length / 2);
    const titleLine1 = pkg.titleLine1 || (words.length <= 1 ? 'PAKET SPESIAL' : words.slice(0, half).join(' '));
    const titleLine2 = pkg.titleLine2 || (words.length <= 1 ? words[0] : words.slice(half).join(' '));

    conn
      .prepare(
        `INSERT OR REPLACE INTO packages (
          id, name, title_line_1, title_line_2, rank_label, category, plate_style, accent_tint,
          price, hpp, min_order, rating, likes, chef_name, chef_title, chef_quote, serving_note,
          allergens_json, equipment_json, video_duration, video_highlights_json, items_json,
          is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM packages WHERE id = ?), ?), ?)`
      )
      .run(
        pkg.id,
        pkg.name,
        titleLine1,
        titleLine2,
        pkg.rankLabel || '#Baru Rilis',
        pkg.category,
        pkg.plateStyle || 'buffet',
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
        pkg.isActive === false ? 0 : 1,
        pkg.id,
        nowIso,
        nowIso
      );
    return mapPackageRow(conn.prepare('SELECT * FROM packages WHERE id = ?').get(pkg.id));
  }

  function createOrderSync(order) {
    const conn = ensureOpen();
    const nowIso = new Date().toISOString();
    conn
      .prepare(
        `INSERT INTO orders (
          id, customer_name, whatsapp, event_date, event_time, address, notes,
          package_id, package_name, package_price, package_hpp, pax, stalls_json,
          total_amount, dp_amount, dp_verified, status, kitchen_stage, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
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
        order.dpVerified ? 1 : 0,
        order.status,
        order.kitchenStage || 'Persiapan Bahan',
        order.createdAt,
        nowIso
      );
    return mapOrderRow(conn.prepare('SELECT * FROM orders WHERE id = ?').get(order.id));
  }

  return {
    driver: 'sqlite',
    async ensureReady() {
      if (!readyPromise) {
        readyPromise = Promise.resolve().then(() => {
          ensureOpen();
          seedData({ preserveCredentials: true });
        });
      }
      return readyPromise;
    },
    async close() {
      if (db) {
        db.close();
        db = null;
        readyPromise = null;
      }
    },
    async getCredential(role) {
      return ensureOpen().prepare('SELECT * FROM staff_credentials WHERE role = ?').get(role) || null;
    },
    async setCredential(role, pin) {
      const nowIso = new Date().toISOString();
      ensureOpen()
        .prepare('INSERT OR REPLACE INTO staff_credentials (role, display_name, pin_hash, updated_at) VALUES (?, ?, ?, ?)')
        .run(role, ROLE_META[role]?.label || role, hashPin(pin), nowIso);
    },
    async listPackages() {
      return ensureOpen().prepare('SELECT * FROM packages ORDER BY rowid ASC').all().map(mapPackageRow);
    },
    async getPackage(id) {
      return mapPackageRow(ensureOpen().prepare('SELECT * FROM packages WHERE id = ?').get(id));
    },
    async upsertPackage(pkg) {
      return upsertPackageSync(pkg);
    },
    async deletePackage(id) {
      const res = ensureOpen().prepare('DELETE FROM packages WHERE id = ?').run(id);
      return res.changes > 0;
    },
    async incrementPackageLike(id) {
      const conn = ensureOpen();
      conn.prepare('UPDATE packages SET likes = likes + 1, updated_at = ? WHERE id = ?').run(new Date().toISOString(), id);
      return mapPackageRow(conn.prepare('SELECT * FROM packages WHERE id = ?').get(id));
    },
    async listStalls() {
      return ensureOpen().prepare('SELECT * FROM stalls ORDER BY rowid ASC').all().map(mapStallRow);
    },
    async listOrders() {
      return ensureOpen().prepare('SELECT * FROM orders ORDER BY created_at DESC, rowid DESC').all().map(mapOrderRow);
    },
    async getOrder(id) {
      return mapOrderRow(ensureOpen().prepare('SELECT * FROM orders WHERE id = ?').get(id));
    },
    async createOrder(order) {
      return createOrderSync(order);
    },
    async updateOrder(id, patch) {
      const existing = mapOrderRow(ensureOpen().prepare('SELECT * FROM orders WHERE id = ?').get(id));
      if (!existing) return null;
      const merged = { ...existing, ...patch };
      ensureOpen()
        .prepare(
          `UPDATE orders SET
            event_date = ?, event_time = ?, notes = ?, dp_verified = ?,
            status = ?, kitchen_stage = ?, updated_at = ?
          WHERE id = ?`
        )
        .run(
          merged.eventDate,
          merged.eventTime,
          merged.notes,
          merged.dpVerified ? 1 : 0,
          merged.status,
          merged.kitchenStage,
          new Date().toISOString(),
          id
        );
      return mapOrderRow(ensureOpen().prepare('SELECT * FROM orders WHERE id = ?').get(id));
    },
    async getAppConfig() {
      const rows = ensureOpen().prepare('SELECT key, value_json FROM app_config').all();
      const base = buildDefaultAppConfig();
      for (const row of rows) {
        base[row.key] = parseJsonSafe(row.value_json, base[row.key]);
      }
      return base;
    },
    async setConfigEntries(entries) {
      const stmt = ensureOpen().prepare(
        'INSERT OR REPLACE INTO app_config (key, value_json, updated_at) VALUES (?, ?, ?)'
      );
      const nowIso = new Date().toISOString();
      for (const [k, v] of Object.entries(entries)) {
        if (v !== undefined) {
          stmt.run(k, JSON.stringify(v), nowIso);
        }
      }
      return this.getAppConfig();
    },
    async listAuditLogs(limit = 50) {
      return ensureOpen()
        .prepare('SELECT id, actor_role AS actorRole, action, target_id AS targetId, summary, created_at AS createdAt FROM audit_logs ORDER BY id DESC LIMIT ?')
        .all(limit);
    },
    async addAuditLog({ actorRole, action, targetId, summary }) {
      ensureOpen()
        .prepare('INSERT INTO audit_logs (actor_role, action, target_id, summary, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(actorRole, action, targetId, summary, new Date().toISOString());
    },
    async resetToSeed() {
      const conn = ensureOpen();
      conn.exec('DELETE FROM orders; DELETE FROM packages; DELETE FROM stalls; DELETE FROM app_config; DELETE FROM audit_logs;');
      seedData({ preserveCredentials: false });
      return this.getAppConfig();
    },
  };
}
