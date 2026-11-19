import React, { useMemo, useState } from 'react';
import { CheckCircle2, Eye, Search, ShoppingBag, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatRupiah } from '../../utils/format.js';
import { TopDownPlateSVG } from '../../components/ui/PlateIllustration.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';

const CATEGORY_ACCENTS = {
  Prasmanan: {
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    bar: 'from-emerald-700 via-emerald-600 to-amber-500',
  },
  'Nasi Box': {
    badge: 'bg-amber-100 text-amber-950 border-amber-300',
    bar: 'from-amber-600 via-orange-500 to-amber-400',
  },
  Tumpeng: {
    badge: 'bg-yellow-100 text-amber-950 border-yellow-400',
    bar: 'from-amber-500 via-yellow-500 to-emerald-700',
  },
  'Live Stall': {
    badge: 'bg-rose-100 text-rose-900 border-rose-300',
    bar: 'from-rose-700 via-amber-600 to-amber-400',
  },
  'Snack Box': {
    badge: 'bg-teal-100 text-teal-900 border-teal-300',
    bar: 'from-teal-700 via-emerald-600 to-amber-400',
  },
};

export function PackageCatalogSection({ onSelectPackageForBooking, onOpenDetailDrawer }) {
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
    <section id="catalog-section" className="sc-container sc-section">
      <Reveal>
        <div className="mb-8 space-y-5">
          <div>
            <span className="sc-eyebrow">Koleksi Sajian &amp; Spesifikasi</span>
            <h2 className="sc-h2">Katalog Paket Catering Pilihan</h2>
            <p className="sc-lead">
              Klik <strong>Detail Lengkap</strong> untuk membuka rincian lauk, perlengkapan saji, dan informasi alergen.
            </p>
          </div>

          {config?.featureFlags?.enableCatalogFilter !== false && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar min-w-0 -mx-1 px-1 py-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 px-4 h-10 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-brand-dark text-amber-300 shadow-md'
                        : 'bg-white border border-stone-200 text-stone-600 hover:border-amber-400 hover:text-brand-dark'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="relative shrink-0">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari paket atau menu..."
                  aria-label="Cari paket atau menu"
                  className="w-full md:w-72 h-10 pl-10 pr-4 rounded-xl border border-stone-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800 shadow-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((pkg, idx) => {
            const accent = CATEGORY_ACCENTS[pkg.category] || CATEGORY_ACCENTS.Prasmanan;
            return (
              <Reveal key={pkg.id} delay={idx * 50}>
                <article className="group bg-white rounded-[var(--sc-radius)] border border-stone-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full">
                  <div className={`h-1.5 w-full bg-gradient-to-r ${accent.bar}`} />
                  <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {pkg.imageUrl ? (
                            <img
                              src={pkg.imageUrl}
                              alt={pkg.name}
                              loading="lazy"
                              className="w-16 h-16 rounded-2xl object-cover border border-amber-200/80 shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                              <TopDownPlateSVG styleType={pkg.plateStyle} size="small" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${accent.badge}`}>
                                {pkg.category}
                              </span>
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-700">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                {pkg.rating}
                              </span>
                            </div>
                            <h3 className="font-extrabold text-base text-brand-dark mt-1">{pkg.name}</h3>
                          </div>
                        </div>
                      </div>

                      {pkg.servingNote && (
                        <p className="min-h-[3.25rem] flex items-center text-xs leading-snug font-semibold text-amber-800 bg-amber-50/70 border border-amber-200/60 px-3 py-2 rounded-xl">
                          {pkg.servingNote}
                        </p>
                      )}

                      <ul className="space-y-1.5 text-xs text-stone-600">
                        {(pkg.items || []).slice(0, 4).map((item) => (
                          <li key={item} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{item}</span>
                          </li>
                        ))}
                        {(pkg.items?.length || 0) > 4 && (
                          <li className="text-[11px] font-bold text-emerald-800 pl-[22px]">
                            +{pkg.items.length - 4} menu pelengkap lainnya
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-black text-brand-dark tabular-nums">
                          {formatRupiah(pkg.price)}
                          <span className="text-[11px] font-normal text-stone-500">/pax</span>
                        </p>
                        <p className="text-[11px] text-stone-500 font-medium">Min. {pkg.minOrder} pax</p>
                      </div>
                      <div className="grid grid-cols-2 w-full sm:w-auto sm:flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenDetailDrawer(pkg)}
                          className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl border border-stone-300 bg-[#FAF8F5] hover:bg-amber-50 hover:border-amber-400 text-stone-800 font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-700" />
                          <span>Detail Lengkap</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectPackageForBooking(pkg)}
                          className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl bg-brand-dark hover:opacity-95 text-amber-300 font-extrabold text-xs shadow-sm cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Pilih</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
