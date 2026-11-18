import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  FileText,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatRupiah, formatTanggalIndo } from '../../utils/format.js';
import { InvoiceModal } from '../../components/shared/InvoiceModal.jsx';

const ORDER_STEPS = ['Menunggu DP', 'DP Lunas', 'Diproses Dapur', 'Dikirim', 'Selesai'];

export function ClientPortalView({ preloadedOrder, onBackToShowcase, onReorderPackage }) {
  const { config, trackClientOrder, updateClientNote, packages } = useApp();
  const [orderIdInput, setOrderIdInput] = useState(preloadedOrder?.id || 'SJC-2026-001');
  const [whatsappInput, setWhatsappInput] = useState(preloadedOrder?.whatsapp || '0812-8890-1122');
  const [activeOrder, setActiveOrder] = useState(preloadedOrder || null);
  const [noteDraft, setNoteDraft] = useState(preloadedOrder?.notes || '');
  const [lookupError, setLookupError] = useState('');
  const [loading, setLoading] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  useEffect(() => {
    if (preloadedOrder) {
      setActiveOrder(preloadedOrder);
      setOrderIdInput(preloadedOrder.id);
      setWhatsappInput(preloadedOrder.whatsapp);
      setNoteDraft(preloadedOrder.notes || '');
    }
  }, [preloadedOrder]);

  const handleFind = async (e) => {
    e.preventDefault();
    setLookupError('');
    setLoading(true);
    try {
      const found = await trackClientOrder(orderIdInput, whatsappInput);
      setActiveOrder(found);
      setNoteDraft(found.notes || '');
    } catch (err) {
      setActiveOrder(null);
      setLookupError(err.message || 'Pesanan tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!activeOrder || !noteDraft.trim()) return;
    try {
      const updated = await updateClientNote(activeOrder.id, whatsappInput, noteDraft.trim());
      setActiveOrder(updated);
    } catch (err) {
      setLookupError(err.message);
    }
  };

  const currentStepIdx = activeOrder ? Math.max(0, ORDER_STEPS.indexOf(activeOrder.status)) : 0;
  const dpPercent = config.business?.dpPercent || 50;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Portal Pemantauan Pesanan Klien
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Pantau status produksi dapur, pembayaran DP, perbarui catatan acara, dan cetak invoice.
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToShowcase}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 font-semibold text-xs hover:bg-zinc-50 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </button>
      </div>

      <form
        onSubmit={handleFind}
        className="bg-white rounded-2xl border border-zinc-200 p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
      >
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-zinc-700 mb-1">Kode Booking</label>
          <input
            type="text"
            required
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value)}
            placeholder="SJC-2026-001"
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-800"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-zinc-700 mb-1">Nomor WhatsApp</label>
          <input
            type="tel"
            required
            value={whatsappInput}
            onChange={(e) => setWhatsappInput(e.target.value)}
            placeholder="0812-8890-1122"
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="py-2.5 px-4 rounded-xl bg-brand-primary hover:bg-brand-dark text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{loading ? 'Mencari...' : 'Buka Pesanan'}</span>
        </button>
      </form>

      {lookupError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{lookupError}</span>
        </div>
      )}

      {activeOrder && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
            <div>
              <span className="text-xs font-mono font-bold text-brand-primary">{activeOrder.id}</span>
              <h2 className="text-xl font-bold text-zinc-900">{activeOrder.customerName}</h2>
              <p className="text-xs text-zinc-500">
                {activeOrder.packageName} ({activeOrder.pax} pax) · {formatTanggalIndo(activeOrder.eventDate)} ·{' '}
                {activeOrder.eventTime} WIB
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setInvoiceOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 text-zinc-800 font-semibold text-xs hover:bg-zinc-50 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Cetak Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const pkg = packages.find((p) => p.id === activeOrder.packageId);
                  onReorderPackage?.(pkg || { id: activeOrder.packageId, minOrder: activeOrder.pax });
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-primary text-white font-semibold text-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Pesan Ulang</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ORDER_STEPS.map((step, idx) => {
                const done = idx <= currentStepIdx;
                return (
                  <div
                    key={step}
                    className={`p-3 rounded-xl border text-center ${
                      done ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-zinc-50 border-zinc-200 text-zinc-400'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 mx-auto mb-1 ${done ? 'text-brand-primary' : 'text-zinc-300'}`} />
                    <p className="text-xs font-semibold">{step}</p>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-2 text-zinc-600 font-medium">
                <ChefHat className="w-4 h-4 text-zinc-500" />
                Tahap Dapur Saat Ini
              </span>
              <span className="font-bold text-zinc-900">{activeOrder.kitchenStage || 'Persiapan Bahan'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-2 text-xs">
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-zinc-500" />
                <span>Status Pembayaran</span>
              </h3>
              <div className="flex justify-between">
                <span className="text-zinc-500">Total Tagihan:</span>
                <strong className="text-zinc-900">{formatRupiah(activeOrder.totalAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">DP ({dpPercent}%):</span>
                <strong className="text-brand-primary">{formatRupiah(activeOrder.dpAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Verifikasi:</span>
                <span className="font-semibold inline-flex items-center gap-1 text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {activeOrder.dpVerified ? 'Terverifikasi' : 'Menunggu Admin'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveNote} className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-2.5">
              <label className="block font-bold text-xs text-zinc-900">Catatan Alergi / Acara</label>
              <textarea
                rows={2}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 text-white font-semibold text-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simpan Catatan</span>
              </button>
            </form>
          </div>
        </div>
      )}

      <InvoiceModal order={invoiceOpen ? activeOrder : null} onClose={() => setInvoiceOpen(false)} />
    </main>
  );
}
