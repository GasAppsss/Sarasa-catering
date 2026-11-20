import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  MessageCircle,
  ShoppingBag,
  UserCheck,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { copyTextSafe, formatRupiah, formatTanggalIndo, getDateOffset } from '../../utils/format.js';
import { calculateOrderPricing } from '../../utils/pricing.js';
import { Modal } from '../../components/ui/Modal.jsx';
import { AnimatedCounter, MagneticButton, Reveal } from '../../components/ui/Reveal.jsx';

export function BookingCalculator({
  selectedPkgId,
  onChangePkgId,
  pax,
  onChangePax,
  eventDate,
  onChangeEventDate,
  formError,
  onChangeFormError,
  onOrderCreated,
  onOpenClientPortal,
}) {
  const { packages, stalls, calendarDates, config, createOrder, backendStatus } = useApp();
  const activePackages = useMemo(() => packages.filter((p) => p.isActive !== false), [packages]);
  const activeStalls = useMemo(() => stalls.filter((s) => s.isActive !== false), [stalls]);
  const activePkg = useMemo(
    () => activePackages.find((p) => p.id === selectedPkgId) || activePackages[0],
    [activePackages, selectedPkgId]
  );

  const [selectedStalls, setSelectedStalls] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [eventTime, setEventTime] = useState('11:30');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [copiedWa, setCopiedWa] = useState(false);

  const selectedDateInfo = useMemo(
    () => calendarDates.find((d) => d.dateStr === eventDate),
    [calendarDates, eventDate]
  );
  const isDateFullyBooked = selectedDateInfo?.status === 'Penuh';
  const dpPercent = config.business?.dpPercent || 50;

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

  const generateWhatsAppText = (o) => {
    if (!o) return '';
    const stallLines =
      o.stalls?.length > 0
        ? o.stalls.map((s) => `- ${s.name} (${s.pax} pax): ${formatRupiah(s.price * s.pax)}`).join('\n')
        : '- Tidak ada tambahan pondokan';
    return `Halo Admin *${config.brand?.name || 'Sajian Catering'}*, saya ingin konfirmasi pesanan berikut:\n\n*Kode Pesanan:* ${o.id}\n*Nama:* ${o.customerName}\n*Tanggal Acara:* ${formatTanggalIndo(o.eventDate)} (${o.eventTime} WIB)\n*Alamat:* ${o.address}\n\n*Paket Utama:* ${o.packageName} (${o.pax} pax)\n*Pondokan (Stall):*\n${stallLines}\n\n*Total Estimasi:* ${formatRupiah(o.totalAmount)}\n*Nominal DP (${dpPercent}%):* ${formatRupiah(o.dpAmount)}\n\nMohon konfirmasi transfer ke ${config.business?.bankName} (${config.business?.bankAccountNumber}). Terima kasih!`;
  };

  const minLead = config.business?.minLeadDays ?? 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    onChangeFormError('');
    if (!activePkg) return onChangeFormError('Silakan pilih paket catering terlebih dahulu.');
    if (Number(pax) < activePkg.minOrder) {
      return onChangeFormError(`Jumlah minimal pemesanan untuk ${activePkg.name} adalah ${activePkg.minOrder} pax.`);
    }
    const earliestDate = getDateOffset(minLead);
    if (!eventDate || eventDate < earliestDate) {
      return onChangeFormError(
        `Tanggal acara minimal H-${minLead} dari hari ini (${formatTanggalIndo(earliestDate, false)}).`
      );
    }
    if (isDateFullyBooked) {
      return onChangeFormError(`Maaf, tanggal ${formatTanggalIndo(eventDate)} sudah Penuh.`);
    }
    if (!customerName.trim() || !whatsapp.trim() || !address.trim()) {
      return onChangeFormError('Mohon lengkapi Nama Pemesan, Nomor WhatsApp, dan Alamat Acara.');
    }
    const waDigits = whatsapp.replace(/\D/g, '');
    if (waDigits.length < 9) {
      return onChangeFormError('Masukkan nomor WhatsApp aktif minimal 9 digit angka.');
    }

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
    } catch (err) {
      onChangeFormError(err.message || 'Gagal memproses pesanan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="booking-calculator-section" className="sc-container sc-section">
      <Reveal>
        <div className="mb-8">
          <span className="sc-eyebrow">Simulasi Transparan &amp; Pemesanan</span>
          <h2 className="sc-h2">Kalkulator Estimasi Biaya &amp; Formulir Booking</h2>
          <p className="sc-lead">
            Atur porsi paket utama, tambahkan gubukan/stall, dan kunci jadwal dapur {config.brand?.name || 'Sajian Catering'}.
          </p>
        </div>
      </Reveal>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[var(--sc-radius)] border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
              <span className="w-8 h-8 rounded-full bg-brand-dark text-amber-400 font-bold text-sm flex items-center justify-center">
                1
              </span>
              <div>
                <h3 className="font-bold text-lg text-brand-dark">Pilih Paket Utama &amp; Jumlah Porsi (Pax)</h3>
                <p className="text-xs text-stone-500">Terhubung otomatis dengan pilihan Showcase di atas.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Paket Catering Utama
                </label>
                <select
                  value={activePkg?.id || ''}
                  onChange={(e) => {
                    const target = activePackages.find((p) => p.id === e.target.value);
                    onChangePkgId(e.target.value);
                    if (target && pax < target.minOrder) onChangePax(target.minOrder);
                  }}
                  className="w-full rounded-xl border border-stone-300 bg-[#FAF8F5] px-3.5 py-3 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-emerald-800"
                >
                  {activePackages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatRupiah(p.price)}/pax (Min. {p.minOrder} pax)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Jumlah Porsi (Pax)
                </label>
                <input
                  type="number"
                  min={activePkg?.minOrder || 1}
                  value={pax}
                  onChange={(e) => onChangePax(Number(e.target.value))}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-3 text-sm font-extrabold text-brand-dark focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
                {activePkg && (
                  <p className={`text-[11px] mt-1 font-semibold ${pax < activePkg.minOrder ? 'text-rose-600' : 'text-stone-500'}`}>
                    Minimal order: {activePkg.minOrder} pax
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[var(--sc-radius)] border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
              <span className="w-8 h-8 rounded-full bg-brand-dark text-amber-400 font-bold text-sm flex items-center justify-center">
                2
              </span>
              <div>
                <h3 className="font-bold text-lg text-brand-dark">Tambahan Pondokan / Live Stall (Opsional)</h3>
                <p className="text-xs text-stone-500">Pilih menu pondokan favorit untuk melengkapi jamuan utama.</p>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              {activeStalls.map((stall) => {
                const isChecked = Boolean(selectedStalls[stall.id]?.selected);
                const stallPax = selectedStalls[stall.id]?.pax || Math.max(40, pax);
                return (
                  <div
                    key={stall.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isChecked
                        ? 'bg-amber-50/70 border-amber-400 shadow-sm'
                        : 'bg-[#FAF8F5] border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <label className="flex items-start gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleStall(stall.id)}
                          className="mt-1 w-4 h-4 rounded accent-emerald-900"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-brand-dark">{stall.name}</span>
                            <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                              +{formatRupiah(stall.price)}/pax
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 mt-0.5">{stall.description}</p>
                        </div>
                      </label>
                      {isChecked && (
                        <div className="flex items-center gap-2 pl-7 sm:pl-0">
                          <span className="text-xs font-bold text-stone-600">Porsi:</span>
                          <input
                            type="number"
                            min={10}
                            value={stallPax}
                            onChange={(e) => handleStallPaxChange(stall.id, e.target.value)}
                            className="w-20 rounded-xl border border-amber-400 bg-white px-2.5 py-1.5 text-sm font-extrabold text-brand-dark text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <span className="text-xs text-stone-500">pax</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-[var(--sc-radius)] border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
              <span className="w-8 h-8 rounded-full bg-brand-dark text-amber-400 font-bold text-sm flex items-center justify-center">
                3
              </span>
              <div>
                <h3 className="font-bold text-lg text-brand-dark">Informasi Pemesan &amp; Lokasi Acara</h3>
                <p className="text-xs text-stone-500">Digunakan untuk pembuatan Invoice resmi dan instruksi dapur.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Nama Lengkap Pemesan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ibu Siti Rahmawati"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Nomor WhatsApp Aktif *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 0812-3456-7890"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Tanggal Acara *
                </label>
                <input
                  type="date"
                  required
                  min={getDateOffset(minLead)}
                  value={eventDate}
                  onChange={(e) => {
                    onChangeEventDate(e.target.value);
                    onChangeFormError('');
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 ${
                    isDateFullyBooked
                      ? 'border-rose-500 bg-rose-50 text-rose-900 focus:ring-rose-500'
                      : 'border-stone-300 bg-white text-brand-dark focus:ring-emerald-800'
                  }`}
                />
                {isDateFullyBooked ? (
                  <p className="text-xs text-rose-600 font-bold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Tanggal ini Fully Booked!</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">✓ Jadwal dapur tersedia</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Jam Hidangan Siap *
                </label>
                <input
                  type="time"
                  required
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Alamat Lengkap Lokasi Acara *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Nama gedung/jalan, nomor rumah, kecamatan, dan patokan..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Catatan Alergi, Diet &amp; Dekorasi (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 5 tamu alergi udang, sambal dipisah, nuansa meja hijau-emas..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="bg-brand-dark text-white rounded-[var(--sc-radius)] p-6 sm:p-7 shadow-2xl border border-white/10 space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">Live Summary</span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">Ringkasan Estimasi Biaya</h3>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-amber-400/40 flex items-center justify-center text-amber-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-bold text-white">{activePkg?.name}</p>
                  <p className="text-xs text-emerald-200">
                    {pax} pax × {formatRupiah(activePkg?.price || 0)}
                  </p>
                </div>
                <span className="font-extrabold text-white tabular-nums">{formatRupiah(pricingSummary.mainSubtotal)}</span>
              </div>
              {pricingSummary.stallDetails.length > 0 && (
                <div className="pt-2.5 border-t border-white/15 space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Tambahan Pondokan:</p>
                  {pricingSummary.stallDetails.map((st) => (
                    <div key={st.id} className="flex justify-between text-xs text-emerald-100">
                      <span>
                        {st.name} ({st.pax} pax)
                      </span>
                      <span className="font-bold tabular-nums">{formatRupiah(st.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-3 border-t border-white/15 flex justify-between text-xs text-emerald-200">
                <span>Jadwal Acara:</span>
                <span className="font-bold text-amber-300">
                  {formatTanggalIndo(eventDate, false)} • {eventTime} WIB
                </span>
              </div>
            </div>

            <div className="bg-black/25 rounded-2xl p-4 border border-white/10 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-emerald-200">Total Estimasi</span>
                <span className="text-xl font-black text-white tabular-nums">{formatRupiah(pricingSummary.grandTotal)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <div>
                  <span className="text-xs font-extrabold uppercase text-amber-400 block">
                    Uang Muka / DP ({dpPercent}%)
                  </span>
                  <span className="text-[11px] text-emerald-200">Mengunci jadwal &amp; bahan baku</span>
                </div>
                <span className="text-lg font-black text-amber-400 tabular-nums">{formatRupiah(pricingSummary.dpAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-emerald-200 pt-1">
                <span>Pelunasan (H-1 Acara)</span>
                <span className="tabular-nums">{formatRupiah(pricingSummary.remainingAmount)}</span>
              </div>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-500 text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <MagneticButton
              type="submit"
              disabled={isDateFullyBooked || submitting}
              className={`w-full py-3.5 px-5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg ${
                isDateFullyBooked
                  ? 'bg-stone-600 text-stone-300 cursor-not-allowed'
                  : 'bg-brand-accent text-brand-dark shimmer-btn'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{submitting ? 'Memproses Jadwal...' : 'Kunci Jadwal & Buat Pesanan'}</span>
            </MagneticButton>
          </div>
        </div>
      </form>

      <Modal isOpen={Boolean(confirmedOrder)} onClose={() => setConfirmedOrder(null)} maxWidth="max-w-lg">
        {confirmedOrder && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200">
            <div className="bg-brand-dark p-6 text-white text-center relative">
              <button
                type="button"
                aria-label="Tutup konfirmasi"
                onClick={() => setConfirmedOrder(null)}
                className="absolute top-4 right-4 text-emerald-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-14 h-14 rounded-full bg-brand-accent text-brand-dark flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className="text-xl font-extrabold">Pesanan Berhasil Terjadwal!</h3>
              <p className="text-xs text-emerald-200 mt-1">
                {backendStatus === 'connected'
                  ? 'Pesanan tersimpan real-time di server cloud Sajian Catering. Silakan lanjutkan konfirmasi WhatsApp.'
                  : 'Kode booking berhasil dibuat. Klik tombol Konfirmasi WhatsApp di bawah untuk mengirim rincian ke Admin.'}
              </p>
              <div className="mt-3 inline-block px-3.5 py-1 rounded-full bg-white/10 border border-amber-400/50 text-amber-300 text-xs font-mono font-bold">
                Kode Booking: {confirmedOrder.id}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-stone-200 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Pemesan:</span>
                  <span className="font-semibold text-stone-900">{confirmedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Jadwal:</span>
                  <span className="font-semibold text-stone-800">
                    {formatTanggalIndo(confirmedOrder.eventDate, false)} ({confirmedOrder.eventTime})
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-200">
                  <span className="font-bold text-brand-dark">Tagihan DP ({dpPercent}%):</span>
                  <span className="font-extrabold text-amber-700">
                    <AnimatedCounter value={confirmedOrder.dpAmount} />
                  </span>
                </div>
              </div>

              {config.featureFlags?.enableWhatsAppCheckout !== false && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      copyTextSafe(generateWhatsAppText(confirmedOrder));
                      setCopiedWa(true);
                      setTimeout(() => setCopiedWa(false), 3000);
                    }}
                    className="py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedWa ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedWa ? 'Teks Tersalin!' : 'Salin Format WA'}</span>
                  </button>
                  <a
                    href={`https://wa.me/${config.business?.whatsappNumber}?text=${encodeURIComponent(
                      generateWhatsAppText(confirmedOrder)
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Konfirmasi WhatsApp</span>
                  </a>
                </div>
              )}

              <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const ord = confirmedOrder;
                    setConfirmedOrder(null);
                    onOpenClientPortal?.(ord);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Pantau di Portal Klien</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmedOrder(null)}
                  className="py-2.5 px-4 rounded-xl text-stone-500 hover:text-stone-800 font-semibold text-xs cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
