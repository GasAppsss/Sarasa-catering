import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Clock,
  Flame,
  Printer,
  ShieldCheck,
  Utensils,
} from 'lucide-react';
import { DashboardShell } from '../../components/layout/DashboardShell.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatTanggalIndo, getDateOffset } from '../../utils/format.js';
import { aggregateKitchenSheet } from '../../utils/pricing.js';

const KITCHEN_STAGES = ['Persiapan Bahan', 'Sedang Dimasak', 'QC & Packing', 'Siap Kirim'];

export function KitchenDashboardView({ embedded = false, onBackToSite }) {
  const { orders, packages, config, updateKitchenStage } = useApp();
  const [activeTab, setActiveTab] = useState('sheet');

  const availableDates = useMemo(
    () => Array.from(new Set(orders.map((o) => o.eventDate))).sort(),
    [orders]
  );
  const [selectedDate, setSelectedDate] = useState(availableDates[0] || getDateOffset(3));

  const kitchenSummary = useMemo(
    () => aggregateKitchenSheet(orders, packages, selectedDate),
    [orders, packages, selectedDate]
  );

  const dailyMaxPax = config.business?.dailyMaxPax || 600;
  const loadPct = Math.min(100, Math.round((kitchenSummary.totalPax / dailyMaxPax) * 100));

  const content = (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-zinc-200 p-4">
          <p className="text-[11px] font-medium text-zinc-500">Pesanan Tanggal Ini</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1 tabular-nums">
            {kitchenSummary.ordersOnDate.length}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-zinc-200 p-4">
          <p className="text-[11px] font-medium text-zinc-500">Total Porsi Produksi</p>
          <p className="text-2xl font-bold text-brand-primary mt-1 tabular-nums">
            {kitchenSummary.totalPax} <span className="text-xs font-medium text-zinc-500">pax</span>
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-zinc-200 p-4">
          <p className="text-[11px] font-medium text-zinc-500">Jenis Hidangan</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1 tabular-nums">
            {kitchenSummary.aggregatedDishes.length}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-zinc-200 p-4 space-y-2">
          <div className="flex justify-between text-[11px] font-semibold text-zinc-600">
            <span>Beban Kapasitas</span>
            <span className="tabular-nums">{loadPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${loadPct >= 85 ? 'bg-rose-600' : 'bg-brand-primary'}`}
              style={{ width: `${loadPct}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-400">
            {kitchenSummary.totalPax} / {dailyMaxPax} pax
          </p>
        </div>
      </div>

      {(activeTab === 'sheet' || embedded) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
            <h2 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-zinc-500" />
              <span>Agregasi Total Masakan Utama</span>
            </h2>
            {kitchenSummary.aggregatedDishes.length === 0 ? (
              <p className="text-xs text-zinc-400 py-8 text-center">Belum ada produksi pada tanggal ini.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {kitchenSummary.aggregatedDishes.map((d) => (
                  <div
                    key={d.name}
                    className="flex items-start justify-between gap-2 p-3 rounded-xl bg-zinc-50 border border-zinc-100"
                  >
                    <div>
                      <p className="font-semibold text-xs text-zinc-900">{d.name}</p>
                      <p className="text-[11px] text-zinc-500">{d.sources.join(' · ')}</p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-[11px] font-bold tabular-nums">
                      {d.totalPax} pax
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3">
            <h2 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-zinc-500" />
              <span>Agregasi Live Stall / Pondokan</span>
            </h2>
            {kitchenSummary.aggregatedStalls.length === 0 ? (
              <p className="text-xs text-zinc-400 py-8 text-center">Tidak ada pondokan pada tanggal ini.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {kitchenSummary.aggregatedStalls.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-start justify-between gap-2 p-3 rounded-xl bg-amber-50/50 border border-amber-200/80"
                  >
                    <div>
                      <p className="font-semibold text-xs text-zinc-900">{s.name}</p>
                      <p className="text-[11px] text-zinc-500">{s.sources.join(' · ')}</p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 text-[11px] font-bold tabular-nums">
                      {s.totalPax} pax
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {(activeTab === 'queue' || embedded) && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-sm text-zinc-900">Antrean Tiket Produksi &amp; Tahap Dapur</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              Margin HPP tersembunyi (Scope Kitchen)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kitchenSummary.ordersOnDate.map((ord) => (
              <div key={ord.id} className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-brand-primary">{ord.id}</span>
                    <h3 className="font-bold text-sm text-zinc-900">{ord.customerName}</h3>
                    <p className="text-xs text-zinc-600">
                      {ord.packageName} · <strong className="text-zinc-900">{ord.pax} pax</strong>
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-white border border-zinc-200 px-2.5 py-1 rounded-lg text-zinc-700">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    {ord.eventTime} WIB
                  </span>
                </div>

                <p className="text-[11px] text-zinc-500">{ord.address}</p>

                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Catatan Dapur:</strong> {ord.notes}
                  </span>
                </div>

                <div className="no-print pt-2 border-t border-zinc-200/70 flex flex-wrap gap-1.5">
                  {KITCHEN_STAGES.map((stage) => {
                    const active = (ord.kitchenStage || 'Persiapan Bahan') === stage;
                    return (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => updateKitchenStage(ord.id, stage)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-zinc-900 text-white'
                            : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400'
                        }`}
                      >
                        {active && <CheckCircle2 className="w-3 h-3" />}
                        <span>{stage}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) return content;

  return (
    <DashboardShell
      roleLabel="POV Admin Dapur"
      title="Kitchen Command Center"
      subtitle="Fokus pada lembar produksi harian, catatan alergi, dan progres dapur."
      navItems={[
        { id: 'sheet', label: 'Lembar Produksi', icon: ChefHat },
        { id: 'queue', label: 'Antrean Pesanan', icon: ClipboardList },
      ]}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onBackToSite={onBackToSite}
      headerActions={
        <>
          <select
            aria-label="Pilih tanggal produksi dapur"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold bg-white"
          >
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {formatTanggalIndo(d)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-primary text-white font-semibold text-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Sheet</span>
          </button>
        </>
      }
    >
      {content}
    </DashboardShell>
  );
}
