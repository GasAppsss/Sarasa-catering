import React from 'react';
import { AlertCircle, History, Package, TrendingUp, Users, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatRupiah } from '../../utils/format.js';

export function AdminOverviewTab() {
  const { kpiStats, orders, auditLogs } = useApp();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Omzet Terjadwal',
            value: formatRupiah(kpiStats.totalOmzet),
            sub: `${kpiStats.activeCount} pesanan aktif · ${kpiStats.totalPaxScheduled} pax`,
            icon: TrendingUp,
            highlight: true,
          },
          {
            label: 'Estimasi Gross Profit',
            value: formatRupiah(kpiStats.grossProfit),
            sub: `Margin kotor ${kpiStats.marginPercent}% (HPP ${formatRupiah(kpiStats.totalHpp)})`,
            icon: Package,
          },
          {
            label: 'DP & Pelunasan Masuk',
            value: formatRupiah(kpiStats.collectedDp),
            sub: `Sisa piutang ${formatRupiah(kpiStats.remainingReceivable)}`,
            icon: Wallet,
          },
          {
            label: 'Menunggu Verifikasi DP',
            value: `${kpiStats.pendingAction} pesanan`,
            sub: `Dari total ${orders.length} transaksi`,
            icon: AlertCircle,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl bg-white border border-zinc-200 p-5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-zinc-500">{card.label}</p>
                <Icon className={`w-4 h-4 ${card.highlight ? 'text-brand-primary' : 'text-zinc-400'}`} />
              </div>
              <p className={`text-xl font-extrabold tabular-nums ${card.highlight ? 'text-brand-primary' : 'text-zinc-900'}`}>
                {card.value}
              </p>
              <p className="text-[11px] text-zinc-500">{card.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3">
          <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-400" />
            <span>Distribusi Status Pesanan</span>
          </h3>
          <div className="space-y-2.5">
            {['Menunggu DP', 'DP Lunas', 'Diproses Dapur', 'Dikirim', 'Selesai'].map((st) => {
              const list = orders.filter((o) => o.status === st);
              const pct = orders.length > 0 ? Math.round((list.length / orders.length) * 100) : 0;
              return (
                <div key={st} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-zinc-700">
                    <span>{st}</span>
                    <span className="tabular-nums text-zinc-500">
                      {list.length} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                    <div className="h-full bg-brand-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3">
          <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
            <History className="w-4 h-4 text-zinc-400" />
            <span>Log Aktivitas Terbaru</span>
          </h3>
          {auditLogs.length === 0 ? (
            <p className="text-xs text-zinc-400 py-8 text-center">Belum ada aktivitas terekam pada sesi ini.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {auditLogs.slice(0, 12).map((log) => (
                <div
                  key={log.id}
                  className="bg-zinc-50 border border-zinc-100 rounded-xl p-2.5 text-xs flex items-start justify-between gap-2"
                >
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-800 mr-1.5">
                      {log.actorRole}
                    </span>
                    <span className="text-zinc-700">{log.summary}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 shrink-0">
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
