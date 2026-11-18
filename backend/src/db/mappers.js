export function parseJsonSafe(raw, fallback) {
  if (typeof raw !== 'string') return raw ?? fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function mapPackageRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    titleLine1: row.title_line_1,
    titleLine2: row.title_line_2,
    rankLabel: row.rank_label,
    category: row.category,
    plateStyle: row.plate_style,
    accentTint: row.accent_tint,
    price: Number(row.price),
    hpp: Number(row.hpp),
    minOrder: Number(row.min_order),
    rating: row.rating,
    likes: Number(row.likes),
    chefName: row.chef_name,
    chefTitle: row.chef_title,
    chefQuote: row.chef_quote,
    servingNote: row.serving_note,
    allergens: parseJsonSafe(row.allergens_json, []),
    equipment: parseJsonSafe(row.equipment_json, []),
    videoDuration: row.video_duration,
    videoHighlights: parseJsonSafe(row.video_highlights_json, []),
    items: parseJsonSafe(row.items_json, []),
    isActive: Boolean(row.is_active),
  };
}

export function mapStallRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    hpp: Number(row.hpp),
    description: row.description,
    isActive: Boolean(row.is_active),
  };
}

export function mapOrderRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    customerName: row.customer_name,
    whatsapp: row.whatsapp,
    eventDate: row.event_date,
    eventTime: row.event_time,
    address: row.address,
    notes: row.notes,
    packageId: row.package_id,
    packageName: row.package_name,
    packagePrice: Number(row.package_price),
    packageHpp: Number(row.package_hpp),
    pax: Number(row.pax),
    stalls: parseJsonSafe(row.stalls_json, []),
    totalAmount: Number(row.total_amount),
    dpAmount: Number(row.dp_amount),
    dpVerified: Boolean(row.dp_verified),
    status: row.status,
    kitchenStage: row.kitchen_stage,
    createdAt: row.created_at,
  };
}

export function stripPackageFinancials(pkg) {
  const { hpp: _hpp, ...rest } = pkg;
  return rest;
}

export function stripStallFinancials(stall) {
  const { hpp: _hpp, ...rest } = stall;
  return rest;
}

export function stripOrderFinancials(order, { includePrices = true } = {}) {
  const { packageHpp: _pkgHpp, stalls = [], ...rest } = order;
  const cleanStalls = stalls.map(({ hpp: _hpp, price, ...sRest }) =>
    includePrices ? { ...sRest, price } : sRest
  );
  if (includePrices) {
    return { ...rest, stalls: cleanStalls };
  }
  const {
    packagePrice: _pPrice,
    totalAmount: _total,
    dpAmount: _dp,
    dpVerified: _dpv,
    ...kitchenOrder
  } = rest;
  return { ...kitchenOrder, stalls: cleanStalls };
}
