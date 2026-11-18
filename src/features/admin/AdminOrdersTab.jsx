import React, { useMemo, useState } from 'react';
import { CheckCircle2, FileText, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatRupiah, formatTanggalIndo } from '../../utils/format.js';
import { InvoiceModal } from '../../components/shared/InvoiceModal.jsx';

const STATUS_OPTIONS = ['Menunggu DP', 'DP Lunas', 'Diproses Dapur', 'Dikirim', 'Selesai'];

export function AdminOrdersTab() {
  const { orders, updateAdminOrder } = useApp();
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  const filteredOrders = useMemo(
    () =>
      orders.filter((o) => {
        const matchStatus = statusFilter === 'Semua' || o.status === statusFilter;
        const q = searchQuery.toLowerCase();
        const matchQuery =
          !q ||
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.packageName.toLowerCase().includes(q);
        return matchStatus && matchQuery;
      }),
    [orders, searchQuery, statusFilter]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode pesanan, nama klien, atau paket..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {['Semua', ...STATUS_OPTIONS].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                statusFilter === s
                  ? 'bg-brand-dark text-amber-300 shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-stone-200">
        <table className="w-full text-sm">
          <thead className="bg-[#FAF8F5] text-stone-500">
            <tr>
              {['Kode', 'Pelanggan', 'Jadwal', 'Paket', 'Total', 'Verifikasi DP', 'Status', 'Aksi'].map((h) => (
                <th
                  key={h}
                  className="text-left font-bold text-[11px] uppercase tracking-wider px-3 sm:px-4 py-3 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-stone-400 text-sm">
                  Tidak ada pesanan yang sesuai filter.
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => (
                <tr key={o.id} className="border-t border-stone-100 hover:bg-amber-50/40">
                  <td className="px-3 sm:px-4 py-3 font-mono text-xs font-bold text-emerald-900 whitespace-nowrap">
                    {o.id}
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <p className="font-bold text-stone-900 text-xs">{o.customerName}</p>
                    <p className="text-[11px] text-stone-500">{o.whatsapp}</p>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-xs whitespace-nowrap">
                    <p className="font-semibold text-stone-800">{formatTanggalIndo(o.eventDate, false)}</p>
                    <p className="text-stone-500">{o.eventTime} WIB</p>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-xs">
                    <p className="font-semibold text-stone-800">{o.packageName}</p>
                    <p className="text-stone-500">{o.pax} pax</p>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-xs font-extrabold text-stone-900 whitespace-nowrap tabular-nums">
                    {formatRupiah(o.totalAmount)}
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        updateAdminOrder(o.id, {
                          dpVerified: !o.dpVerified,
                          status: !o.dpVerified && o.status === 'Menunggu DP' ? 'DP Lunas' : o.status,
                        })
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        o.dpVerified
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-stone-100 text-stone-600 hover:bg-amber-100'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{o.dpVerified ? 'Terverifikasi' : 'Verifikasi'}</span>
                    </button>
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <select
                      aria-label={`Status pesanan ${o.id}`}
                      value={o.status}
                      onChange={(e) => updateAdminOrder(o.id, { status: e.target.value })}
                      className="text-[11px] font-bold rounded-lg px-2 py-1.5 border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setInvoiceOrder(o)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-dark text-amber-300 text-[11px] font-bold cursor-pointer"
                    >
                      <FileText className="w-3 h-3" /> Invoice
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
    </div>
  );
}
