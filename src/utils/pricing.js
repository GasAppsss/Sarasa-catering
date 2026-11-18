import { getDateOffset } from './format.js';

export function calculateOrderPricing({ pkg, pax, stallsList = [], selectedStalls = {}, dpPercent = 50 }) {
  const pkgPrice = Number(pkg?.price) || 0;
  const validPax = Math.max(0, Number(pax) || 0);
  const mainSubtotal = pkgPrice * validPax;

  const stallDetails = [];
  let stallsSubtotal = 0;

  for (const s of stallsList) {
    if (s.isActive === false) continue;
    const entry = selectedStalls[s.id];
    if (entry?.selected) {
      const sPax = Math.max(10, Number(entry.pax) || validPax);
      const sub = Number(s.price) * sPax;
      stallsSubtotal += sub;
      stallDetails.push({
        id: s.id,
        name: s.name,
        price: Number(s.price),
        hpp: Number(s.hpp || 0),
        pax: sPax,
        subtotal: sub,
      });
    }
  }

  const grandTotal = mainSubtotal + stallsSubtotal;
  const pct = Math.min(100, Math.max(10, Number(dpPercent) || 50));
  const dpAmount = Math.round((grandTotal * pct) / 100);

  return {
    mainSubtotal,
    stallDetails,
    stallsSubtotal,
    grandTotal,
    dpPercent: pct,
    dpAmount,
    remainingAmount: Math.max(0, grandTotal - dpAmount),
  };
}

export function computeCalendarDates({ orders = [], calendarSlots = null, business = {}, days = 14 }) {
  const dailyMaxPax = Number(business?.dailyMaxPax) || 600;
  const blockedDates = new Set(business?.blockedDates || []);
  const slotMap = new Map((calendarSlots || []).map((s) => [s.dateStr, s]));
  const result = [];

  for (let i = 1; i <= days; i += 1) {
    const dateStr = getDateOffset(i);
    const serverSlot = slotMap.get(dateStr);
    const bookedPax = serverSlot
      ? Number(serverSlot.bookedPax)
      : orders
          .filter((o) => o.eventDate === dateStr && o.status !== 'Dibatalkan')
          .reduce((sum, o) => sum + Number(o.pax || 0), 0);

    let status = serverSlot?.status || 'Tersedia';
    if (!serverSlot) {
      if (blockedDates.has(dateStr) || bookedPax >= dailyMaxPax) {
        status = 'Penuh';
      } else if (bookedPax > 0) {
        status = 'Slot Terbatas';
      }
    }

    const [y, m, d] = dateStr.split('-').map(Number);
    const dObj = new Date(y, m - 1, d);
    result.push({
      dateStr,
      dayName: dObj.toLocaleDateString('id-ID', { weekday: 'short' }),
      dayNum: d,
      monthShort: dObj.toLocaleDateString('id-ID', { month: 'short' }),
      status,
      bookedPax,
      dailyMaxPax,
    });
  }

  return result;
}

export function computeKpiStats(orders = []) {
  const active = orders.filter((o) => o.status !== 'Selesai');
  const totalOmzet = orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const totalHpp = orders.reduce((s, o) => {
    const mainHpp = Number(o.packageHpp || 0) * Number(o.pax || 0);
    const stallHpp = (o.stalls || []).reduce((ss, st) => ss + Number(st.hpp || 0) * Number(st.pax || 0), 0);
    return s + mainHpp + stallHpp;
  }, 0);
  const collectedDp = orders
    .filter((o) => o.status !== 'Menunggu DP')
    .reduce((s, o) => s + (o.status === 'Selesai' ? Number(o.totalAmount || 0) : Number(o.dpAmount || 0)), 0);
  const grossProfit = Math.max(0, totalOmzet - totalHpp);
  const marginPercent = totalOmzet > 0 ? Math.round((grossProfit / totalOmzet) * 100) : 0;

  return {
    activeCount: active.length,
    totalPaxScheduled: active.reduce((s, o) => s + Number(o.pax || 0), 0),
    totalOmzet,
    totalHpp,
    grossProfit,
    marginPercent,
    collectedDp,
    remainingReceivable: Math.max(0, totalOmzet - collectedDp),
    pendingAction: orders.filter((o) => o.status === 'Menunggu DP').length,
  };
}

export function aggregateKitchenSheet(orders = [], packages = [], selectedDate) {
  const ordersOnDate = orders
    .filter((o) => o.eventDate === selectedDate)
    .sort((a, b) => String(a.eventTime).localeCompare(String(b.eventTime)));

  const dishMap = {};
  const stallMap = {};

  for (const order of ordersOnDate) {
    const pkg = packages.find((p) => p.id === order.packageId);
    const dishList = pkg?.items?.length ? pkg.items : [`Menu ${order.packageName}`];
    for (const dish of dishList) {
      if (!dishMap[dish]) dishMap[dish] = { name: dish, totalPax: 0, sources: [] };
      dishMap[dish].totalPax += Number(order.pax || 0);
      dishMap[dish].sources.push(`${order.id} (${order.pax} pax)`);
    }
    for (const st of order.stalls || []) {
      if (!stallMap[st.name]) stallMap[st.name] = { name: st.name, totalPax: 0, sources: [] };
      stallMap[st.name].totalPax += Number(st.pax || 0);
      stallMap[st.name].sources.push(`${order.id} (${st.pax} pax)`);
    }
  }

  return {
    ordersOnDate,
    aggregatedDishes: Object.values(dishMap).sort((a, b) => b.totalPax - a.totalPax),
    aggregatedStalls: Object.values(stallMap).sort((a, b) => b.totalPax - a.totalPax),
    totalPax: ordersOnDate.reduce((s, o) => s + Number(o.pax || 0), 0),
  };
}
