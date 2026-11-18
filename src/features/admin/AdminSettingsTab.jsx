import React, { useState } from 'react';
import { CalendarOff, Plus, Save, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export function AdminSettingsTab() {
  const { config, saveBusinessSettings } = useApp();
  const [business, setBusiness] = useState({ ...config.business });
  const [faq, setFaq] = useState([...(config.faq || [])]);
  const [termsText, setTermsText] = useState((config.terms || []).join('\n'));
  const [blockDateInput, setBlockDateInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddBlockedDate = () => {
    if (!blockDateInput || business.blockedDates?.includes(blockDateInput)) return;
    setBusiness((p) => ({
      ...p,
      blockedDates: [...(p.blockedDates || []), blockDateInput].sort(),
    }));
    setBlockDateInput('');
  };

  const handleRemoveBlockedDate = (dateStr) => {
    setBusiness((p) => ({
      ...p,
      blockedDates: (p.blockedDates || []).filter((d) => d !== dateStr),
    }));
  };

  const handleAddFaq = () => {
    setFaq((prev) => [
      ...prev,
      { id: `faq-${Date.now()}`, question: 'Pertanyaan baru...', answer: 'Jawaban lengkap...' },
    ]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveBusinessSettings({
        business: {
          ...business,
          dpPercent: Number(business.dpPercent),
          dailyMaxPax: Number(business.dailyMaxPax),
          minLeadDays: Number(business.minLeadDays),
        },
        faq,
        terms: termsText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-stone-200 bg-[#FAF8F5] p-5 space-y-4">
          <h3 className="font-extrabold text-sm text-brand-dark">Identitas Kontak &amp; Rekening Resmi</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-stone-600 mb-1">Nomor WhatsApp (Format 628...)</label>
              <input
                type="text"
                value={business.whatsappNumber}
                onChange={(e) => setBusiness((p) => ({ ...p, whatsappNumber: e.target.value }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-600 mb-1">Telepon Tampil</label>
              <input
                type="text"
                value={business.phoneDisplay}
                onChange={(e) => setBusiness((p) => ({ ...p, phoneDisplay: e.target.value }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-600 mb-1">Email Bisnis</label>
              <input
                type="email"
                value={business.email}
                onChange={(e) => setBusiness((p) => ({ ...p, email: e.target.value }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-600 mb-1">Instagram</label>
              <input
                type="text"
                value={business.instagram}
                onChange={(e) => setBusiness((p) => ({ ...p, instagram: e.target.value }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-stone-600 mb-1">Alamat Dapur Pusat</label>
              <input
                type="text"
                value={business.address}
                onChange={(e) => setBusiness((p) => ({ ...p, address: e.target.value }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-stone-600 mb-1">Area Layanan &amp; Jam Operasional</label>
              <input
                type="text"
                value={business.serviceArea}
                onChange={(e) => setBusiness((p) => ({ ...p, serviceArea: e.target.value }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 mb-2"
              />
              <input
                type="text"
                value={business.operatingHours}
                onChange={(e) => setBusiness((p) => ({ ...p, operatingHours: e.target.value }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-600 mb-1">Nama Bank</label>
              <input
                type="text"
                value={business.bankName}
                onChange={(e) => setBusiness((p) => ({ ...p, bankName: e.target.value }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-600 mb-1">No. Rekening DP</label>
              <input
                type="text"
                value={business.bankAccountNumber}
                onChange={(e) => setBusiness((p) => ({ ...p, bankAccountNumber: e.target.value }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-stone-600 mb-1">Atas Nama Rekening</label>
              <input
                type="text"
                value={business.bankAccountHolder}
                onChange={(e) => setBusiness((p) => ({ ...p, bankAccountHolder: e.target.value }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-[#FAF8F5] p-5 space-y-4">
          <h3 className="font-extrabold text-sm text-brand-dark">Aturan Kapasitas Dapur, DP &amp; Promo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-stone-600 mb-1">Persentase DP (%)</label>
              <input
                type="number"
                min={10}
                max={100}
                value={business.dpPercent}
                onChange={(e) => setBusiness((p) => ({ ...p, dpPercent: Number(e.target.value) }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-600 mb-1">Kapasitas Max/Hari (pax)</label>
              <input
                type="number"
                min={50}
                max={10000}
                value={business.dailyMaxPax}
                onChange={(e) => setBusiness((p) => ({ ...p, dailyMaxPax: Number(e.target.value) }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-600 mb-1">Min. H-Booking (hari)</label>
              <input
                type="number"
                min={0}
                max={30}
                value={business.minLeadDays}
                onChange={(e) => setBusiness((p) => ({ ...p, minLeadDays: Number(e.target.value) }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 font-bold"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold text-stone-600 mb-1">Banner Pengumuman Publik (Header Atas)</label>
            <input
              type="text"
              value={business.announcementBanner}
              onChange={(e) => setBusiness((p) => ({ ...p, announcementBanner: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
            />
          </div>

          <div className="text-xs space-y-2">
            <label className="block font-bold text-stone-600">Tutup Tanggal Manual (Libur / Penuh)</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={blockDateInput}
                onChange={(e) => setBlockDateInput(e.target.value)}
                className="rounded-xl border border-stone-300 bg-white px-3 py-1.5"
              />
              <button
                type="button"
                onClick={handleAddBlockedDate}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-dark text-amber-300 font-bold cursor-pointer"
              >
                <CalendarOff className="w-3.5 h-3.5" /> Blokir Tanggal
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(business.blockedDates || []).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleRemoveBlockedDate(d)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 font-mono font-bold cursor-pointer"
                >
                  <span>{d}</span>
                  <span>×</span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold text-stone-600 mb-1">Syarat &amp; Ketentuan (satu poin per baris)</label>
            <textarea
              rows={4}
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-[#FAF8F5] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-brand-dark">Editor FAQ Pelanggan</h3>
          <button
            type="button"
            onClick={handleAddFaq}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah FAQ
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {faq.map((item, idx) => (
            <div key={item.id} className="bg-white rounded-xl border border-stone-200 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={item.question}
                  onChange={(e) =>
                    setFaq((prev) => prev.map((f, i) => (i === idx ? { ...f, question: e.target.value } : f)))
                  }
                  className="flex-1 font-bold text-brand-dark border-b border-stone-200 pb-1 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setFaq((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                rows={2}
                value={item.answer}
                onChange={(e) =>
                  setFaq((prev) => prev.map((f, i) => (i === idx ? { ...f, answer: e.target.value } : f)))
                }
                className="w-full text-stone-600 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-dark text-amber-300 font-extrabold text-xs shadow-lg cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan Bisnis'}</span>
        </button>
      </div>
    </form>
  );
}
