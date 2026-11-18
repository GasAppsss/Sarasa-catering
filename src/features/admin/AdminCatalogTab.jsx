import React, { useState } from 'react';
import { AlertCircle, Edit3, Eye, EyeOff, Plus, Star, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatRupiah } from '../../utils/format.js';
import { TopDownPlateSVG } from '../../components/ui/PlateIllustration.jsx';

const EMPTY_FORM = {
  id: '',
  name: '',
  category: 'Prasmanan',
  plateStyle: 'buffet',
  price: 58000,
  hpp: 32000,
  minOrder: 40,
  chefName: 'Chef Feny Maharani',
  servingNote: 'Porsi penuh + perlengkapan saji standar Sajian Catering',
  allergensText: '',
  equipmentText: 'Chafing Dish Roll-Top\nPramusaji Berseragam',
  itemsText: '',
  isActive: true,
};

export function AdminCatalogTab() {
  const { packages, savePackage, deletePackage } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const startEdit = (pkg) => {
    setForm({
      id: pkg.id,
      name: pkg.name,
      category: pkg.category,
      plateStyle: pkg.plateStyle || 'buffet',
      price: pkg.price,
      hpp: pkg.hpp || 0,
      minOrder: pkg.minOrder,
      chefName: pkg.chefName || 'Chef Feny Maharani',
      servingNote: pkg.servingNote || '',
      allergensText: (pkg.allergens || []).join(', '),
      equipmentText: (pkg.equipment || []).join('\n'),
      itemsText: (pkg.items || []).join('\n'),
      isActive: pkg.isActive !== false,
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Nama paket wajib diisi.');
    if (Number(form.hpp) >= Number(form.price)) return setError('HPP harus lebih kecil dari harga jual.');
    const items = form.itemsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length === 0) return setError('Isi minimal 1 item menu (satu per baris).');

    try {
      await savePackage({
        id: form.id || undefined,
        name: form.name.trim(),
        category: form.category,
        plateStyle: form.plateStyle,
        price: Number(form.price),
        hpp: Number(form.hpp),
        minOrder: Number(form.minOrder),
        chefName: form.chefName.trim(),
        servingNote: form.servingNote.trim(),
        allergens: form.allergensText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        equipment: form.equipmentText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        items,
        isActive: form.isActive,
      });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-lg text-brand-dark">Manajemen Katalog Paket &amp; Margin</h3>
          <p className="text-xs text-stone-500">Tambah, edit, atau nonaktifkan paket langsung dari dashboard admin.</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-accent text-brand-dark font-extrabold text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Paket Baru</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="rounded-2xl border border-emerald-200 bg-[#FAF8F5] p-5 space-y-4">
          <h4 className="font-extrabold text-sm text-brand-dark">
            {form.id ? `Edit Paket: ${form.name}` : 'Tambah Paket Catering Baru'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">Nama Paket *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-bold"
              >
                {['Prasmanan', 'Nasi Box', 'Tumpeng', 'Snack Box', 'Live Stall'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">Harga Jual (Rp) *</label>
              <input
                type="number"
                min={1000}
                required
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">HPP Internal (Rp) *</label>
              <input
                type="number"
                min={500}
                required
                value={form.hpp}
                onChange={(e) => setForm((p) => ({ ...p, hpp: Number(e.target.value) }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">Min. Order (pax)</label>
              <input
                type="number"
                min={1}
                value={form.minOrder}
                onChange={(e) => setForm((p) => ({ ...p, minOrder: Number(e.target.value) }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">Gaya Piring</label>
              <select
                value={form.plateStyle}
                onChange={(e) => setForm((p) => ({ ...p, plateStyle: e.target.value }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-bold"
              >
                <option value="buffet">Buffet</option>
                <option value="bento">Bento</option>
                <option value="tumpeng">Tumpeng</option>
                <option value="roast">Roast</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">Catatan Porsi &amp; Alergen (pisahkan koma)</label>
              <input
                type="text"
                value={form.allergensText}
                onChange={(e) => setForm((p) => ({ ...p, allergensText: e.target.value }))}
                placeholder="Contoh: Kacang, Udang"
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">Daftar Menu (satu per baris) *</label>
              <textarea
                rows={4}
                required
                value={form.itemsText}
                onChange={(e) => setForm((p) => ({ ...p, itemsText: e.target.value }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">Perlengkapan (satu per baris)</label>
              <textarea
                rows={4}
                value={form.equipmentText}
                onChange={(e) => setForm((p) => ({ ...p, equipmentText: e.target.value }))}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-600 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-dark text-amber-300 text-xs font-extrabold cursor-pointer"
            >
              Simpan Paket
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((p) => {
          const margin = p.price > 0 ? Math.round(((p.price - (p.hpp || 0)) / p.price) * 100) : 0;
          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-4 space-y-3 ${
                p.isActive === false ? 'bg-stone-50 border-stone-200 opacity-70' : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <TopDownPlateSVG styleType={p.plateStyle} size="small" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900">
                    {p.category}
                  </span>
                  <button
                    type="button"
                    title={p.isActive === false ? 'Aktifkan paket' : 'Sembunyikan dari katalog publik'}
                    onClick={() => savePackage({ ...p, isActive: p.isActive === false })}
                    className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 cursor-pointer"
                  >
                    {p.isActive === false ? <EyeOff className="w-3.5 h-3.5 text-stone-500" /> : <Eye className="w-3.5 h-3.5 text-emerald-700" />}
                  </button>
                </div>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-brand-dark">{p.name}</h4>
                <p className="text-[11px] text-stone-500">
                  {p.chefName} • <Star className="w-3 h-3 inline text-amber-500" /> {p.rating}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100 text-xs">
                <div>
                  <p className="text-[10px] text-stone-500">Jual</p>
                  <p className="font-extrabold text-brand-dark">{formatRupiah(p.price)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-500">HPP</p>
                  <p className="font-bold text-stone-700">{formatRupiah(p.hpp || 0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-stone-500">Margin</p>
                  <p className="font-extrabold text-amber-700">{margin}%</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => startEdit(p)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-300 text-[11px] font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => deletePackage(p.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-[11px] font-bold text-rose-700 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Hapus
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
