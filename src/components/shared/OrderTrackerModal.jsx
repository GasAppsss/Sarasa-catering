import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatTanggalIndo } from '../../utils/format.js';
import { Modal } from '../ui/Modal.jsx';

export function OrderTrackerModal({ isOpen, onClose, onOpenClientPortal }) {
  const { trackClientOrder } = useApp();
  const [orderId, setOrderId] = useState('SJC-2026-001');
  const [whatsapp, setWhatsapp] = useState('0812-8890-1122');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const order = await trackClientOrder(orderId, whatsapp);
      setResult(order);
    } catch (err) {
      setError(err.message || 'Pesanan tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200">
        <div className="bg-brand-dark text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base">Lacak Cepat Status Pesanan</h3>
            <p className="text-xs text-emerald-300">Verifikasi dengan Kode Booking &amp; Nomor WhatsApp pemesan</p>
          </div>
          <button
            type="button"
            aria-label="Tutup pelacak pesanan"
            onClick={onClose}
            className="text-emerald-200 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleLookup} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">Kode Booking</label>
              <input
                type="text"
                required
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="SJC-2026-001"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">No. WhatsApp Pemesan</label>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-brand-dark text-amber-300 font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Mencari...' : 'Periksa Status Pesanan'}</span>
          </button>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-mono font-bold text-emerald-900">{result.id}</span>
                  <p className="font-bold text-sm text-stone-900">{result.customerName}</p>
                  <p className="text-xs text-stone-500">
                    {result.packageName} ({result.pax} pax) • {formatTanggalIndo(result.eventDate, false)}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-900 font-extrabold text-xs shrink-0">
                  {result.status}
                </span>
              </div>
              <p className="text-xs text-emerald-900 font-semibold">
                Tahap Dapur: <span className="underline">{result.kitchenStage}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenClientPortal?.(result);
                }}
                className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Buka Detail di Portal Klien</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
}
