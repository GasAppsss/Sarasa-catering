import React from 'react';
import { AlertCircle, History, Package, TrendingUp, Users, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatRupiah } from '../../utils/format.js';
import { AnimatedCounter } from '../../components/ui/Reveal.jsx';

export function AdminOverviewTab() {
  const { kpiStats, orders, auditLogs } = useApp();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Omzet Terjadwal',
            value: kpiStats.totalOmzet,
            prefix: 'Rp ',
            sub: `${kpiStats.activeCount} pesanan aktif • ${kpiStats.totalPaxScheduled} pax`,
            icon: TrendingUp,
            bg: 'from-emerald-800 to-emerald-950',
            accent: 'text-amber-300',
          },
          {
            label: 'Estimasi Gross Profit',
            value: kpiStats.grossProfit,
            prefix: 'Rp ',
            sub: `Margin kotor: ${kpiStats.marginPercent}% (HPP: ${formatRupiah(kpiStats.totalHpp)})`,
            icon: Package,
            bg: 'from-amber-500 to-amber-700',
            accent: 'text-emerald-950',
          },
          {
            label: 'DP & Pelunasan Masuk',
            value: kpiStats.collectedDp,
            prefix: 'Rp ',
            sub: `Sisa piutang: ${formatRupiah(kpiStats.remainingReceivable)}`,
            icon: Wallet,
            bg: 'from-teal-700 to-emerald-900',
            accent: 'text-amber-300',
          },
          {
            label: 'Menunggu Tindakan DP',
            value: kpiStats.pendingAction,
            prefix: '',
            suffix: ' pesanan',
            sub: `Dari total ${orders.length} transaksi tercatat`,
            icon: AlertCircle,
            bg: 'from-rose-600 to-rose-800',
            accent: 'text-white',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-2xl bg-gradient-to-br ${card.bg} text-white p-5 shadow-md space-y-2`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className={`text-[11px] font-bold uppercase tracking-wider ${card.accent} opacity-95`}>
                  {card.label}
                </p>
                <Icon className={`w-4 h-4 ${card.accent}`} />
              </div>
              <p className="text-xl sm:text-2xl font-black tabular-nums">
                <AnimatedCounter value={card.value} prefix={card.prefix} />
                {card.suffix || ''}
              </p>
              <p className="text-[11px] opacity-85">{card.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-stone-200 bg-[#FAF8F5] p-5 space-y-3">
          <h3 className="font-extrabold text-sm text-brand-dark flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-600" />
            <span>Distribusi Status Pesanan</span>
          </h3>
          <div className="space-y-2">
            {['Menunggu DP', 'DP Lunas', 'Diproses Dapur', 'Dikirim', 'Selesai'].map((st) => {
              const list = orders.filter((o) => o.status === st);
              const pct = orders.length > 0 ? Math.round((list.length / orders.length) * 100) : 0;
              return (
                <div key={st} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-stone-700">
                    <span>{st}</span>
                    <span>
                      {list.length} order ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
                    <div className="h-full bg-brand-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-[#FAF8F5] p-5 space-y-3">
          <h3 className="font-extrabold text-sm text-brand-dark flex items-center gap-2">
            <History className="w-4 h-4 text-amber-600" />
            <span>Log Aktivitas Terbaru</span>
          </h3>
          {auditLogs.length === 0 ? (
            <p className="text-xs text-stone-400 py-8 text-center">Belum ada aktivitas terekam pada sesi ini.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {auditLogs.slice(0, 12).map((log) => (
                <div key={log.id} className="bg-white border border-stone-200 rounded-xl p-2.5 text-xs flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 mr-1.5">
                      {log.actorRole}
                    </span>
                    <span className="text-stone-700 font-medium">{log.summary}</span>
                  </div>
                  <span className="text-[10px] text-stone-400 shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
