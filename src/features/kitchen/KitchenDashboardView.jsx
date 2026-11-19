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
import { AnimatedCounter, Reveal } from '../../components/ui/Reveal.jsx';
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
        <div className="rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white p-4 shadow-md">
          <p className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Pesanan Tanggal Ini</p>
          <p className="text-2xl font-black mt-1 tabular-nums">
            <AnimatedCounter value={kitchenSummary.ordersOnDate.length} prefix="" />
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-emerald-950 p-4 shadow-md">
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Total Porsi Produksi</p>
          <p className="text-2xl font-black mt-1 tabular-nums">
            <AnimatedCounter value={kitchenSummary.totalPax} prefix="" /> pax
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-teal-700 to-emerald-900 text-white p-4 shadow-md">
          <p className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Jenis Hidangan</p>
          <p className="text-2xl font-black mt-1 tabular-nums">
            <AnimatedCounter value={kitchenSummary.aggregatedDishes.length} prefix="" />
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200 p-4 shadow-sm space-y-2">
          <div className="flex justify-between text-[11px] font-extrabold text-brand-dark">
            <span>Beban Kapasitas</span>
            <span className="tabular-nums">{loadPct}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-stone-200 overflow-hidden">
            <div
              className={`h-full rounded-full ${loadPct >= 85 ? 'bg-rose-600' : 'bg-emerald-700'}`}
              style={{ width: `${loadPct}%` }}
            />
          </div>
          <p className="text-[10px] text-stone-500">
            {kitchenSummary.totalPax} / {dailyMaxPax} pax maksimal
          </p>
        </div>
      </div>

      {(activeTab === 'sheet' || embedded) && (
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm space-y-3">
              <h2 className="font-extrabold text-base text-brand-dark flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-600" />
                <span>Agregasi Total Masakan Utama</span>
              </h2>
              {kitchenSummary.aggregatedDishes.length === 0 ? (
                <p className="text-xs text-stone-400 py-8 text-center">Belum ada produksi pada tanggal ini.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {kitchenSummary.aggregatedDishes.map((d) => (
                    <div
                      key={d.name}
                      className="flex items-start justify-between gap-2 p-3 rounded-xl bg-[#FAF8F5] border border-stone-200"
                    >
                      <div>
                        <p className="font-bold text-xs text-stone-900">{d.name}</p>
                        <p className="text-[10px] text-stone-500">{d.sources.join(' • ')}</p>
                      </div>
                      <span className="shrink-0 px-2.5 py-1 rounded-lg bg-brand-dark text-amber-300 text-xs font-extrabold tabular-nums">
                        {d.totalPax} pax
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm space-y-3">
              <h2 className="font-extrabold text-base text-brand-dark flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-600" />
                <span>Agregasi Live Stall / Pondokan</span>
              </h2>
              {kitchenSummary.aggregatedStalls.length === 0 ? (
                <p className="text-xs text-stone-400 py-8 text-center">Tidak ada pondokan pada tanggal ini.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {kitchenSummary.aggregatedStalls.map((s) => (
                    <div
                      key={s.name}
                      className="flex items-start justify-between gap-2 p-3 rounded-xl bg-amber-50/70 border border-amber-200"
                    >
                      <div>
                        <p className="font-bold text-xs text-stone-900">{s.name}</p>
                        <p className="text-[10px] text-stone-500">{s.sources.join(' • ')}</p>
                      </div>
                      <span className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500 text-emerald-950 text-xs font-extrabold tabular-nums">
                        {s.totalPax} pax
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Reveal>
      )}

      {(activeTab === 'queue' || embedded) && (
        <Reveal>
          <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-extrabold text-lg text-brand-dark">Antrean Ticket Produksi &amp; Tahap Dapur</h2>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                Data finansial disembunyikan (Scope Kitchen)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kitchenSummary.ordersOnDate.map((ord) => (
                <div key={ord.id} className="rounded-2xl border border-stone-200 bg-[#FAF8F5] p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-emerald-900">{ord.id}</span>
                      <h3 className="font-extrabold text-sm text-stone-900">{ord.customerName}</h3>
                      <p className="text-xs font-semibold text-stone-700">
                        {ord.packageName} • <span className="text-brand-dark font-extrabold">{ord.pax} pax</span>
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-white border border-stone-300 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {ord.eventTime} WIB
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-600">{ord.address}</p>

                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Catatan Dapur/Alergi: </span>
                      <span>{ord.notes}</span>
                    </div>
                  </div>

                  <div className="no-print pt-2 border-t border-stone-200 flex flex-wrap gap-1.5">
                    {KITCHEN_STAGES.map((stage) => {
                      const active = (ord.kitchenStage || 'Persiapan Bahan') === stage;
                      return (
                        <button
                          key={stage}
                          type="button"
                          onClick={() => updateKitchenStage(ord.id, stage)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-brand-dark text-amber-300 shadow-sm'
                              : 'bg-white border border-stone-300 text-stone-600 hover:border-emerald-700'
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
        </Reveal>
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
            className="rounded-xl border border-stone-300 px-3 py-2 text-xs font-bold bg-[#FAF8F5]"
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-dark text-amber-300 font-bold text-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Kitchen Sheet</span>
          </button>
        </>
      }
    >
      {content}
    </DashboardShell>
  );
}
