import { describe, expect, it } from 'vitest';
import { getDateOffset } from '../utils/format.js';
import {
  aggregateKitchenSheet,
  calculateOrderPricing,
  computeCalendarDates,
  computeKpiStats,
} from '../utils/pricing.js';

describe('Pricing, Calendar & Kitchen Aggregations', () => {
  it('computes subtotal, stalls, and dynamic DP percentage accurately', () => {
    const res = calculateOrderPricing({
      pkg: { id: 'pkg-1', price: 60000 },
      pax: 100,
      stallsList: [
        { id: 's1', name: 'Zuppa', price: 20000, hpp: 10000, isActive: true },
        { id: 's2', name: 'Inactive', price: 15000, hpp: 8000, isActive: false },
      ],
      selectedStalls: {
        s1: { selected: true, pax: 50 },
        s2: { selected: true, pax: 50 },
      },
      dpPercent: 40,
    });

    expect(res.mainSubtotal).toBe(6000000);
    expect(res.stallsSubtotal).toBe(1000000);
    expect(res.grandTotal).toBe(7000000);
    expect(res.dpAmount).toBe(2800000);
    expect(res.remainingAmount).toBe(4200000);
  });

  it('marks blocked dates and full capacity days as Penuh', () => {
    const d2 = getDateOffset(2);
    const d4 = getDateOffset(4);
    const days = computeCalendarDates({
      orders: [{ id: 'O1', eventDate: d4, pax: 500, status: 'DP Lunas' }],
      business: { dailyMaxPax: 500, blockedDates: [d2] },
      days: 7,
    });

    expect(days.find((d) => d.dateStr === d2)?.status).toBe('Penuh');
    expect(days.find((d) => d.dateStr === d4)?.status).toBe('Penuh');
    expect(days.find((d) => d.dateStr === getDateOffset(1))?.status).toBe('Tersedia');
  });

  it('aggregates kitchen dishes and computes KPI gross margin', () => {
    const d3 = getDateOffset(3);
    const orders = [
      {
        id: 'SJC-1',
        eventDate: d3,
        eventTime: '11:00',
        packageId: 'p1',
        packageName: 'Paket A',
        packagePrice: 50000,
        packageHpp: 30000,
        pax: 100,
        stalls: [{ id: 'st1', name: 'Sate', price: 20000, hpp: 10000, pax: 50 }],
        totalAmount: 6000000,
        dpAmount: 3000000,
        status: 'DP Lunas',
      },
    ];
    const kpis = computeKpiStats(orders);
    expect(kpis.totalOmzet).toBe(6000000);
    expect(kpis.totalHpp).toBe(3500000);
    expect(kpis.grossProfit).toBe(2500000);
    expect(kpis.marginPercent).toBe(42);

    const sheet = aggregateKitchenSheet(orders, [{ id: 'p1', items: ['Rendang', 'Nasi'] }], d3);
    expect(sheet.totalPax).toBe(100);
    expect(sheet.aggregatedDishes).toHaveLength(2);
    expect(sheet.aggregatedStalls[0].totalPax).toBe(50);
  });
});
