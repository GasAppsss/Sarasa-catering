import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  MessageCircle,
  Minus,
  Plus,
  UserCheck,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { copyTextSafe, formatRupiah, formatTanggalIndo, getDateOffset } from '../../utils/format.js';
import { calculateOrderPricing } from '../../utils/pricing.js';
import { Modal } from '../../components/ui/Modal.jsx';

const WIZARD_STEPS = [
  { id: 1, title: 'Paket & Porsi' },
  { id: 2, title: 'Tanggal & Lokasi' },
  { id: 3, title: 'Konfirmasi' },
];

export function BookingWizard({
  selectedPkgId,
  onChangePkgId,
  pax,
  onChangePax,
  eventDate,
  onChangeEventDate,
  onOrderCreated,
  onOpenClientPortal,
}) {
  const { packages, stalls, calendarDates, config, createOrder } = useApp();
  const activePackages = useMemo(() => packages.filter((p) => p.isActive !== false), [packages]);
  const activeStalls = useMemo(() => stalls.filter((s) => s.isActive !== false), [stalls]);
  const activePkg = useMemo(
    () => activePackages.find((p) => p.id === selectedPkgId) || activePackages[0],
    [activePackages, selectedPkgId]
  );

  const [step, setStep] = useState(1);
  const [showStalls, setShowStalls] = useState(false);
  const [selectedStalls, setSelectedStalls] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [eventTime, setEventTime] = useState('11:30');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [copiedWa, setCopiedWa] = useState(false);

  const selectedDateInfo = useMemo(
    () => calendarDates.find((d) => d.dateStr === eventDate),
    [calendarDates, eventDate]
  );
  const isDateFullyBooked = selectedDateInfo?.status === 'Penuh';
  const dpPercent = config.business?.dpPercent || 50;
  const minLead = config.business?.minLeadDays ?? 1;

  const pricingSummary = useMemo(
    () =>
      calculateOrderPricing({
        pkg: activePkg,
        pax,
        stallsList: activeStalls,
        selectedStalls,
        dpPercent,
      }),
    [activePkg, activeStalls, dpPercent, pax, selectedStalls]
  );

  const handleToggleStall = (stallId) => {
    setSelectedStalls((prev) => {
      if (prev[stallId]?.selected) {
        const next = { ...prev };
        delete next[stallId];
        return next;
      }
      return { ...prev, [stallId]: { selected: true, pax: Math.max(40, pax) } };
    });
  };

  const handleStallPaxChange = (stallId, nextPax) => {
    setSelectedStalls((prev) => ({
      ...prev,
      [stallId]: { selected: true, pax: Math.max(10, Number(nextPax) || 10) },
    }));
  };

  const goToStep = (targetStep) => {
    setFormError('');
    if (targetStep >= 2 && activePkg && Number(pax) < activePkg.minOrder) {
      setFormError(`Minimal pemesanan untuk ${activePkg.name} adalah ${activePkg.minOrder} pax.`);
      return;
    }
    if (targetStep === 3) {
      if (isDateFullyBooked) {
        setFormError(`Tanggal ${formatTanggalIndo(eventDate)} sudah penuh. Silakan pilih tanggal lain.`);
        return;
      }
      if (!customerName.trim() || !whatsapp.trim() || !address.trim()) {
        setFormError('Lengkapi Nama Pemesan, Nomor WhatsApp, dan Alamat Lokasi Acara terlebih dahulu.');
        return;
      }
    }
    setStep(targetStep);
  };

  const generateWhatsAppText = (o) => {
    if (!o) return '';
    const stallLines =
      o.stalls?.length > 0
        ? o.stalls.map((s) => `- ${s.name} (${s.pax} pax): ${formatRupiah(s.price * s.pax)}`).join('\n')
        : '- Tidak ada tambahan pondokan';
    return `Halo Admin *${config.brand?.name || 'Sajian Catering'}*, saya ingin konfirmasi pesanan:\n\n*Kode Pesanan:* ${o.id}\n*Nama:* ${o.customerName}\n*Acara:* ${formatTanggalIndo(o.eventDate)} (${o.eventTime} WIB)\n*Alamat:* ${o.address}\n\n*Paket:* ${o.packageName} (${o.pax} pax)\n*Pondokan:*\n${stallLines}\n\n*Total Estimasi:* ${formatRupiah(o.totalAmount)}\n*Nominal DP (${dpPercent}%):* ${formatRupiah(o.dpAmount)}\n\nTerima kasih!`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const stallsPayload = pricingSummary.stallDetails.map(({ id, pax: sp }) => ({ id, pax: sp }));
      const created = await createOrder({
        packageId: activePkg.id,
        pax: Number(pax),
        stalls: stallsPayload,
        customerName: customerName.trim(),
        whatsapp: whatsapp.trim(),
        eventDate,
        eventTime,
        address: address.trim(),
        notes: notes.trim() || 'Tidak ada catatan tambahan.',
      });
      setConfirmedOrder(created);
      setCopiedWa(false);
      onOrderCreated?.(created);
      setCustomerName('');
      setWhatsapp('');
      setAddress('');
      setNotes('');
      setStep(1);
    } catch (err) {
      setFormError(err.message || 'Gagal membuat pesanan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="booking-wizard-section" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            Pesan &amp; Hitung Estimasi Biaya
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Ikuti 3 langkah sederhana untuk mengecek jadwal dapur dan mengunci estimasi acara Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {WIZARD_STEPS.map((s) => {
            const active = step === s.id;
            const passed = step > s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goToStep(s.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  active
                    ? 'bg-zinc-900 border-zinc-900 text-white'
                    : passed
                      ? 'bg-emerald-50 border-emerald-200 text-brand-primary'
                      : 'bg-white border-zinc-200 text-zinc-500'
                }`}
              >
                <span className="font-mono">{s.id}.</span>
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 min-w-0 bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Paket Catering Utama</label>
                  <select
                    value={activePkg?.id || ''}
                    onChange={(e) => {
                      const target = activePackages.find((p) => p.id === e.target.value);
                      onChangePkgId(e.target.value);
                      if (target && pax < target.minOrder) onChangePax(target.minOrder);
                    }}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  >
                    {activePackages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatRupiah(p.price)}/pax)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Jumlah Porsi (Pax)</label>
                  <div className="flex items-center border border-zinc-300 rounded-xl overflow-hidden bg-white">
                    <button
                      type="button"
                      aria-label="Kurangi porsi"
                      onClick={() => onChangePax(Math.max(activePkg?.minOrder || 1, Number(pax) - 5))}
                      className="px-3 py-2.5 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={activePkg?.minOrder || 1}
                      value={pax}
                      onChange={(e) => onChangePax(Number(e.target.value))}
                      className="w-full text-center text-sm font-bold text-zinc-900 py-2 focus:outline-none"
                    />
                    <button
                      type="button"
                      aria-label="Tambah porsi"
                      onClick={() => onChangePax(Number(pax) + 5)}
                      className="px-3 py-2.5 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {activePkg && (
                    <p className="text-[11px] text-zinc-400 mt-1">Min. order {activePkg.minOrder} pax</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowStalls((p) => !p)}
                  className="w-full flex items-center justify-between py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 cursor-pointer"
                >
                  <span>
                    Tambahkan Pondokan / Live Stall Opsional ({pricingSummary.stallDetails.length} dipilih)
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showStalls ? 'rotate-180' : ''}`} />
                </button>

                {showStalls && (
                  <div className="space-y-2.5 pt-3">
                    {activeStalls.map((stall) => {
                      const isChecked = Boolean(selectedStalls[stall.id]?.selected);
                      const stallPax = selectedStalls[stall.id]?.pax || Math.max(40, pax);
                      return (
                        <div
                          key={stall.id}
                          className={`p-3.5 rounded-xl border transition-colors ${
                            isChecked ? 'bg-emerald-50/50 border-emerald-300' : 'bg-zinc-50/70 border-zinc-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleStall(stall.id)}
                                className="mt-1 w-4 h-4 accent-emerald-900"
                              />
                              <div>
                                <p className="font-semibold text-xs text-zinc-900">
                                  {stall.name}{' '}
                                  <span className="text-brand-primary font-bold">
                                    (+{formatRupiah(stall.price)}/pax)
                                  </span>
                                </p>
                                <p className="text-[11px] text-zinc-500">{stall.description}</p>
                              </div>
                            </label>
                            {isChecked && (
                              <input
                                type="number"
                                min={10}
                                value={stallPax}
                                onChange={(e) => handleStallPaxChange(stall.id, e.target.value)}
                                className="w-20 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-bold text-center"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-dark text-white font-semibold text-xs sm:text-sm cursor-pointer"
                >
                  <span>Lanjut: Pilih Tanggal &amp; Lokasi</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-zinc-700">
                    Ketersediaan Dapur (14 Hari ke Depan)
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Max {config.business?.dailyMaxPax || 600} pax/hari
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {calendarDates.map((d) => {
                    const isSelected = d.dateStr === eventDate;
                    const isFull = d.status === 'Penuh';
                    return (
                      <button
                        key={d.dateStr}
                        type="button"
                        onClick={() => {
                          onChangeEventDate(d.dateStr);
                          setFormError(isFull ? `Tanggal ${formatTanggalIndo(d.dateStr)} penuh.` : '');
                        }}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isFull
                            ? 'bg-rose-50 border-rose-200 text-rose-400'
                            : isSelected
                              ? 'bg-zinc-900 border-zinc-900 text-white'
                              : 'bg-white border-zinc-200 hover:border-zinc-400 text-zinc-800'
                        }`}
                      >
                        <p className="text-[10px] font-medium opacity-75">{d.dayName}</p>
                        <p className="text-sm font-bold">{d.dayNum}</p>
                        <p className="text-[9px] truncate">{isFull ? 'Penuh' : d.monthShort}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Nama Pemesan *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Ibu Siti Rahmawati"
                    className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Nomor WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="0812-3456-7890"
                    className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Tanggal Acara *</label>
                  <input
                    type="date"
                    required
                    min={getDateOffset(minLead)}
                    value={eventDate}
                    onChange={(e) => {
                      onChangeEventDate(e.target.value);
                      setFormError('');
                    }}
                    className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Jam Hidangan Siap *</label>
                  <input
                    type="time"
                    required
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm font-semibold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Alamat Lengkap Acara *</label>
                  <textarea
                    rows={2}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Nama gedung/jalan, nomor rumah, kecamatan, patokan..."
                    className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Catatan Alergi, Diet &amp; Dekorasi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: 5 tamu alergi udang, sambal dipisah..."
                    className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-dark text-white font-semibold text-xs sm:text-sm cursor-pointer"
                >
                  <span>Lanjut: Review Pesanan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-2 text-xs">
                <p className="font-bold text-zinc-900 text-sm">Konfirmasi Data Pemesanan</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <p><span className="text-zinc-500">Pemesan:</span> <strong>{customerName}</strong></p>
                  <p><span className="text-zinc-500">WhatsApp:</span> <strong>{whatsapp}</strong></p>
                  <p><span className="text-zinc-500">Jadwal:</span> <strong>{formatTanggalIndo(eventDate, false)} · {eventTime} WIB</strong></p>
                  <p><span className="text-zinc-500">Paket:</span> <strong>{activePkg?.name} ({pax} pax)</strong></p>
                </div>
                <p><span className="text-zinc-500">Alamat:</span> {address}</p>
                {notes && <p><span className="text-zinc-500">Catatan:</span> {notes}</p>}
              </div>

              <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-4 text-xs space-y-1 text-emerald-950">
                <p className="font-bold">Rekening Pembayaran DP ({dpPercent}%):</p>
                <p>
                  {config.business?.bankName} · <span className="font-mono font-bold">{config.business?.bankAccountNumber}</span> a.n. {config.business?.bankAccountHolder}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Ubah Data</span>
                </button>
                <button
                  type="submit"
                  disabled={submitting || isDateFullyBooked}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-primary hover:bg-brand-dark text-white font-bold text-xs sm:text-sm cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Menyimpan...' : 'Kunci Jadwal & Buat Booking'}</span>
                </button>
              </div>
            </div>
          )}

          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
        </div>

        <aside className="lg:col-span-5 min-w-0 lg:sticky lg:top-24 bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="font-bold text-sm text-zinc-900">Ringkasan Biaya</h3>
            <span className="text-[11px] font-medium text-zinc-500">Estimasi Transparan</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-600">{activePkg?.name} ({pax} pax)</span>
              <span className="font-bold text-zinc-900 tabular-nums">{formatRupiah(pricingSummary.mainSubtotal)}</span>
            </div>
            {pricingSummary.stallDetails.map((st) => (
              <div key={st.id} className="flex justify-between text-zinc-600">
                <span>+ {st.name} ({st.pax} pax)</span>
                <span className="font-semibold tabular-nums">{formatRupiah(st.subtotal)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-zinc-100 text-zinc-500">
              <span>Tanggal Dipilih</span>
              <span className="font-semibold text-zinc-800">{formatTanggalIndo(eventDate, false)}</span>
            </div>
          </div>

          <div className="rounded-xl bg-zinc-50 border border-zinc-200/80 p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-zinc-700">Total Estimasi</span>
              <span className="text-lg font-extrabold text-zinc-900 tabular-nums">
                {formatRupiah(pricingSummary.grandTotal)}
              </span>
            </div>
            <div className="flex justify-between text-brand-primary font-bold">
              <span>DP ({dpPercent}%)</span>
              <span className="tabular-nums">{formatRupiah(pricingSummary.dpAmount)}</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>Pelunasan H-1</span>
              <span className="tabular-nums">{formatRupiah(pricingSummary.remainingAmount)}</span>
            </div>
          </div>
        </aside>
      </form>

      <Modal isOpen={Boolean(confirmedOrder)} onClose={() => setConfirmedOrder(null)} maxWidth="max-w-md">
        {confirmedOrder && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-zinc-200">
            <div className="p-6 text-center space-y-3 border-b border-zinc-100 relative">
              <button
                type="button"
                aria-label="Tutup modal konfirmasi"
                onClick={() => setConfirmedOrder(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-brand-primary flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Pesanan Terjadwal</h3>
              <p className="text-xs font-mono font-bold text-brand-primary bg-emerald-50 inline-block px-3 py-1 rounded-full">
                {confirmedOrder.id}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-xs space-y-1.5 text-zinc-600">
                <div className="flex justify-between">
                  <span>Pemesan:</span>
                  <strong className="text-zinc-900">{confirmedOrder.customerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Jadwal:</span>
                  <strong className="text-zinc-900">{formatTanggalIndo(confirmedOrder.eventDate, false)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Tagihan DP ({dpPercent}%):</span>
                  <strong className="text-brand-primary">{formatRupiah(confirmedOrder.dpAmount)}</strong>
                </div>
              </div>

              {config.featureFlags?.enableWhatsAppCheckout !== false && (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      copyTextSafe(generateWhatsAppText(confirmedOrder));
                      setCopiedWa(true);
                      setTimeout(() => setCopiedWa(false), 2500);
                    }}
                    className="py-2.5 px-3 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedWa ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWa ? 'Tersalin' : 'Salin WA'}</span>
                  </button>
                  <a
                    href={`https://wa.me/${config.business?.whatsappNumber}?text=${encodeURIComponent(
                      generateWhatsAppText(confirmedOrder)
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-brand-primary hover:bg-brand-dark text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Kirim WA</span>
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  const ord = confirmedOrder;
                  setConfirmedOrder(null);
                  onOpenClientPortal?.(ord);
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-900 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Pantau Progres di Portal Klien</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
