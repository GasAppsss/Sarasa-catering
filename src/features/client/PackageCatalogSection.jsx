import React, { useMemo, useState } from 'react';
import { CheckCircle2, Search, ShoppingBag } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatRupiah } from '../../utils/format.js';
import { TopDownPlateSVG } from '../../components/ui/PlateIllustration.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';

export function PackageCatalogSection({ onSelectPackageForBooking }) {
  const { packages, config } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [query, setQuery] = useState('');

  const activePackages = useMemo(() => packages.filter((p) => p.isActive !== false), [packages]);
  const categories = useMemo(
    () => ['Semua', ...Array.from(new Set(activePackages.map((p) => p.category)))],
    [activePackages]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activePackages.filter((pkg) => {
      const catOk = selectedCategory === 'Semua' || pkg.category === selectedCategory;
      const qOk =
        !q ||
        pkg.name.toLowerCase().includes(q) ||
        pkg.category.toLowerCase().includes(q) ||
        (pkg.items || []).some((it) => it.toLowerCase().includes(q));
      return catOk && qOk;
    });
  }, [activePackages, query, selectedCategory]);

  return (
    <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
      <Reveal>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full">
              Menu &amp; Spesifikasi Lengkap
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-dark mt-2">
              Katalog Paket Catering Pilihan
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              Lengkap dengan estimasi gramasi, perlengkapan saji, dan catatan alergen per paket.
            </p>
          </div>

          {config?.featureFlags?.enableCatalogFilter !== false && (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari menu, rendang, tumpeng..."
                  className="pl-9 pr-4 py-2 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-brand-dark text-amber-300 shadow-sm'
                        : 'bg-white border border-stone-200 text-stone-600 hover:border-emerald-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-[var(--sc-radius)] border border-stone-200 p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <TopDownPlateSVG styleType={pkg.plateStyle} size="small" />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900">
                        {pkg.category}
                      </span>
                      <h3 className="font-extrabold text-base text-brand-dark mt-1">{pkg.name}</h3>
                    </div>
                  </div>
                </div>

                {pkg.servingNote && <p className="text-xs font-semibold text-amber-800">{pkg.servingNote}</p>}

                <ul className="space-y-1 text-xs text-stone-600">
                  {(pkg.items || []).slice(0, 4).map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                  {(pkg.items?.length || 0) > 4 && (
                    <li className="text-[11px] font-semibold text-stone-400 pl-5">
                      +{pkg.items.length - 4} hidangan pelengkap lainnya
                    </li>
                  )}
                </ul>

                {pkg.allergens?.length > 0 && (
                  <p className="text-[11px] text-stone-500">
                    <strong className="text-stone-700">Alergen:</strong> {pkg.allergens.join(', ')}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <div>
                  <p className="text-base font-black text-brand-dark">{formatRupiah(pkg.price)}<span className="text-[11px] font-normal text-stone-500">/pax</span></p>
                  <p className="text-[11px] text-stone-500">Min. {pkg.minOrder} pax</p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectPackageForBooking(pkg)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-dark hover:opacity-95 text-amber-300 font-bold text-xs cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Pilih Paket</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
