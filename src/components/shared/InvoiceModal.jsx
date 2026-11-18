import React from 'react';
import { Printer, Utensils, X } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatRupiah, formatTanggalIndo } from '../../utils/format.js';

export function InvoiceModal({ order, onClose }) {
  const { config } = useApp();
  if (!order) return null;

  const { brand, business } = config;
  const dpPercent = business?.dpPercent || 50;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="printable-invoice-backdrop fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-backdrop-zoom"
      onClick={onClose}
    >
      <div
        className="printable-invoice-card bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-brand-dark text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base">Invoice Resmi — {order.id}</h3>
            <p className="text-xs text-emerald-300">{formatTanggalIndo(order.createdAt, false)}</p>
          </div>
          <button
            type="button"
            aria-label="Tutup invoice"
            onClick={onClose}
            className="no-print text-emerald-200 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center pb-3 border-b border-dashed border-stone-300">
            <div className="inline-flex items-center gap-2 mb-1">
              <Utensils className="w-4 h-4 text-amber-600" />
              <span className="font-extrabold text-emerald-950 text-sm tracking-wider">
                {brand?.name || 'SAJIAN CATERING'}
              </span>
            </div>
            <p className="text-[10px] text-stone-500">
              {business?.address} • {business?.phoneDisplay}
            </p>
          </div>

          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-stone-500">Kepada:</span>
              <span className="font-bold text-stone-900">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Acara:</span>
              <span className="font-semibold text-stone-800">
                {formatTanggalIndo(order.eventDate, false)} • {order.eventTime} WIB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Alamat:</span>
              <span className="font-semibold text-stone-800 text-right max-w-[60%]">{order.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Status:</span>
              <span className="font-bold text-emerald-900">
                {order.status} {order.dpVerified ? '(DP Terverifikasi)' : ''}
              </span>
            </div>
          </div>

          <div className="border-t border-b border-dashed border-stone-300 py-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="font-semibold">
                {order.packageName} × {order.pax} pax
              </span>
              <span className="font-bold">{formatRupiah(order.packagePrice * order.pax)}</span>
            </div>
            {(order.stalls || []).map((s) => (
              <div key={s.id} className="flex justify-between text-stone-600">
                <span className="pl-3">
                  • {s.name} × {s.pax}
                </span>
                <span>{formatRupiah(s.price * s.pax)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between font-extrabold text-emerald-950">
              <span>TOTAL ESTIMASI</span>
              <span className="text-sm tabular-nums">{formatRupiah(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-amber-700 font-bold">
              <span>DP ({dpPercent}%)</span>
              <span className="tabular-nums">{formatRupiah(order.dpAmount)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Sisa Pelunasan</span>
              <span className="tabular-nums">{formatRupiah(order.totalAmount - order.dpAmount)}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-700 space-y-1">
            <p className="font-bold text-emerald-950">Info Transfer Resmi:</p>
            <p>
              {business?.bankName} • <span className="font-mono font-bold">{business?.bankAccountNumber}</span> a.n.{' '}
              {business?.bankAccountHolder}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
            <p className="font-bold mb-0.5">Catatan Khusus:</p>
            <p>{order.notes}</p>
          </div>

          <div className="no-print flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 py-2.5 rounded-xl bg-brand-dark text-amber-300 font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-opacity cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Cetak Invoice
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-600 font-bold text-xs hover:bg-stone-50 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
