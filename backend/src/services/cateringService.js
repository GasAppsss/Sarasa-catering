import { getDateOffsetIso } from '../shared/seedDefaults.js';

export function normalizePhoneDigits(phone = '') {
  return String(phone).replace(/\D/g, '');
}

export function phonesMatch(storedPhone, inputPhone) {
  const a = normalizePhoneDigits(storedPhone);
  const b = normalizePhoneDigits(inputPhone);
  if (!a || !b || b.length < 4) return false;
  return a === b || a.endsWith(b) || b.endsWith(a) || a.slice(-6) === b.slice(-6);
}

export function computeCalendarSlots(orders, businessConfig, days = 14) {
  const dailyMaxPax = Number(businessConfig?.dailyMaxPax) || 600;
  const blockedDates = new Set(businessConfig?.blockedDates || []);
  const slots = [];

  for (let i = 1; i <= days; i += 1) {
    const dateStr = getDateOffsetIso(i);
    const bookedPax = orders
      .filter((o) => o.eventDate === dateStr && o.status !== 'Dibatalkan')
      .reduce((sum, o) => sum + Number(o.pax || 0), 0);

    let status = 'Tersedia';
    if (blockedDates.has(dateStr) || bookedPax >= dailyMaxPax) {
      status = 'Penuh';
    } else if (bookedPax >= Math.round(dailyMaxPax * 0.5) || bookedPax > 0) {
      status = 'Slot Terbatas';
    }

    slots.push({ dateStr, bookedPax, dailyMaxPax, status });
  }
  return slots;
}

export function computeKpiStats(orders) {
  const activeOrders = orders.filter((o) => o.status !== 'Selesai');
  const totalOmzet = orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const totalHpp = orders.reduce((s, o) => {
    const mainHpp = Number(o.packageHpp || 0) * Number(o.pax || 0);
    const stallHpp = (o.stalls || []).reduce((stSum, st) => stSum + Number(st.hpp || 0) * Number(st.pax || 0), 0);
    return s + mainHpp + stallHpp;
  }, 0);
  const collectedDp = orders
    .filter((o) => o.status !== 'Menunggu DP')
    .reduce((s, o) => s + (o.status === 'Selesai' ? Number(o.totalAmount || 0) : Number(o.dpAmount || 0)), 0);
  const grossProfit = Math.max(0, totalOmzet - totalHpp);
  const marginPercent = totalOmzet > 0 ? Math.round((grossProfit / totalOmzet) * 100) : 0;

  return {
    activeCount: activeOrders.length,
    totalPaxScheduled: activeOrders.reduce((s, o) => s + Number(o.pax || 0), 0),
    totalOmzet,
    totalHpp,
    grossProfit,
    marginPercent,
    collectedDp,
    remainingReceivable: Math.max(0, totalOmzet - collectedDp),
    pendingAction: orders.filter((o) => o.status === 'Menunggu DP').length,
  };
}

export function aggregateKitchenSheet(orders, packages, targetDate) {
  const ordersOnDate = orders
    .filter((o) => o.eventDate === targetDate)
    .sort((a, b) => String(a.eventTime).localeCompare(String(b.eventTime)));

  const dishMap = {};
  const stallMap = {};

  for (const order of ordersOnDate) {
    const pkg = packages.find((p) => p.id === order.packageId);
    const dishList = pkg?.items?.length ? pkg.items : [`Menu ${order.packageName}`];
    for (const dish of dishList) {
      if (!dishMap[dish]) {
        dishMap[dish] = { name: dish, totalPax: 0, sources: [] };
      }
      dishMap[dish].totalPax += Number(order.pax || 0);
      dishMap[dish].sources.push(`${order.id} (${order.pax} pax)`);
    }

    for (const stall of order.stalls || []) {
      if (!stallMap[stall.name]) {
        stallMap[stall.name] = { name: stall.name, totalPax: 0, sources: [] };
      }
      stallMap[stall.name].totalPax += Number(stall.pax || 0);
      stallMap[stall.name].sources.push(`${order.id} (${stall.pax} pax)`);
    }
  }

  return {
    date: targetDate,
    ordersOnDate,
    aggregatedDishes: Object.values(dishMap).sort((a, b) => b.totalPax - a.totalPax),
    aggregatedStalls: Object.values(stallMap).sort((a, b) => b.totalPax - a.totalPax),
    totalPax: ordersOnDate.reduce((s, o) => s + Number(o.pax || 0), 0),
  };
}
