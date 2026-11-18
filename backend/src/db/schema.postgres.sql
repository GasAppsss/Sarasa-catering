CREATE TABLE IF NOT EXISTS staff_credentials (
  role TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stalls (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  hpp INTEGER NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
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
  dp_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL,
  kitchen_stage TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_event_date ON orders(event_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_whatsapp ON orders(whatsapp);

CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
