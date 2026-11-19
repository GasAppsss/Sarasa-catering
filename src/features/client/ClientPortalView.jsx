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
const IS_DEV_PREVIEW = Boolean(import.meta.env.BASE_URL?.includes('/preview'));

export function ClientPortalView({ preloadedOrder, onBackToShowcase, onReorderPackage }) {
  const { config, trackClientOrder, updateClientNote, packages } = useApp();
  const [orderIdInput, setOrderIdInput] = useState(
    preloadedOrder?.id || (IS_DEV_PREVIEW ? 'SJC-2026-001' : '')
  );
  const [whatsappInput, setWhatsappInput] = useState(
    preloadedOrder?.whatsapp || (IS_DEV_PREVIEW ? '0812-8890-1122' : '')
  );
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
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full">
            Portal Pelanggan • Lacak Pesanan
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark mt-2">
            Portal Pemantauan Pesanan Klien
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Pantau progres dapur, status pembayaran DP, ubah catatan alergi, cetak invoice, atau pesan ulang.
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToShowcase}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-800 font-bold text-xs hover:border-emerald-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Showcase</span>
        </button>
      </div>

      <form
        onSubmit={handleFind}
        className="bg-white rounded-[var(--sc-radius)] border border-stone-200 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
      >
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">Kode Booking</label>
          <input
            type="text"
            required
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value)}
            placeholder="Contoh: SJC-2026-001"
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-800"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">Nomor WhatsApp Pemesan</label>
          <input
            type="tel"
            required
            value={whatsappInput}
            onChange={(e) => setWhatsappInput(e.target.value)}
            placeholder="0812-8890-1122"
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="py-2.5 px-4 rounded-xl bg-brand-dark text-amber-300 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span>{loading ? 'Mencari...' : 'Buka Pesanan'}</span>
        </button>
      </form>

      {lookupError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{lookupError}</span>
        </div>
      )}

      {activeOrder && (
        <div className="space-y-6">
          <div className="bg-white rounded-[var(--sc-radius)] border border-stone-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-800">{activeOrder.id}</span>
                <h2 className="text-xl font-extrabold text-brand-dark">{activeOrder.customerName}</h2>
                <p className="text-xs text-stone-500">
                  {activeOrder.packageName} ({activeOrder.pax} pax) •{' '}
                  {formatTanggalIndo(activeOrder.eventDate)} • {activeOrder.eventTime} WIB
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setInvoiceOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-dark text-amber-300 font-bold text-xs cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Lihat &amp; Cetak Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pkg = packages.find((p) => p.id === activeOrder.packageId);
                    onReorderPackage?.(pkg || { id: activeOrder.packageId, minOrder: activeOrder.pax });
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Pesan Ulang Paket Ini</span>
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                Progres Pesanan Real-Time
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {ORDER_STEPS.map((step, idx) => {
                  const done = idx <= currentStepIdx;
                  return (
                    <div
                      key={step}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        done
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-stone-50 border-stone-200 text-stone-400'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-5 h-5 mx-auto mb-1 ${done ? 'text-emerald-700' : 'text-stone-300'}`}
                      />
                      <p className="text-xs font-bold">{step}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 p-3 rounded-xl bg-[#FAF8F5] border border-stone-200 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 font-semibold text-stone-700">
                  <ChefHat className="w-4 h-4 text-amber-600" />
                  Status Produksi Dapur Saat Ini:
                </span>
                <span className="font-extrabold text-brand-dark bg-amber-100 px-3 py-1 rounded-full">
                  {activeOrder.kitchenStage || 'Persiapan Bahan'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-[#FAF8F5] border border-stone-200 p-4 space-y-2.5 text-xs">
                <h3 className="font-extrabold text-sm text-brand-dark flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-600" />
                  <span>Ringkasan Pembayaran</span>
                </h3>
                <div className="flex justify-between">
                  <span className="text-stone-500">Total Tagihan:</span>
                  <span className="font-extrabold text-stone-900">{formatRupiah(activeOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Wajib DP ({dpPercent}%):</span>
                  <span className="font-bold text-amber-800">{formatRupiah(activeOrder.dpAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Verifikasi DP:</span>
                  <span className="font-bold inline-flex items-center gap-1 text-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {activeOrder.dpVerified ? 'Sudah Terverifikasi' : 'Menunggu Verifikasi Admin'}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-200 text-[11px] text-stone-600">
                  <p className="font-bold text-stone-800">Rekening Transfer:</p>
                  <p>
                    {config.business?.bankName} • {config.business?.bankAccountNumber} a.n.{' '}
                    {config.business?.bankAccountHolder}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveNote} className="rounded-2xl bg-[#FAF8F5] border border-stone-200 p-4 space-y-3">
                <label className="block font-extrabold text-sm text-brand-dark">
                  Perbarui Catatan Alergi / Dekorasi Acara
                </label>
                <textarea
                  rows={3}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-amber-300 font-bold text-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Simpan Catatan ke Dapur</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <InvoiceModal order={invoiceOpen ? activeOrder : null} onClose={() => setInvoiceOpen(false)} />
    </main>
  );
}
