import React, { useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatRupiah } from '../../utils/format.js';
import { TopDownPlateSVG } from '../../components/ui/PlateIllustration.jsx';

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
    <section id="catalog-section" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            Katalog Paket Catering Pilihan
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Klik detail untuk melihat daftar lengkap lauk, perlengkapan saji, dan catatan alergen.
          </p>
        </div>

        {config?.featureFlags?.enableCatalogFilter !== false && (
          <div className="flex flex-col sm:flex-row gap-2.5 min-w-0">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari paket atau menu..."
                className="w-full sm:w-52 pl-9 pr-3 py-2 rounded-lg border border-zinc-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-800"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 min-w-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
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
          <article
            key={pkg.id}
            className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-300 hover:shadow-sm transition-all flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <TopDownPlateSVG styleType={pkg.plateStyle} size="small" />
                <span className="text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-full">
                  {pkg.category}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-zinc-900">{pkg.name}</h3>
                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{pkg.servingNote}</p>
              </div>

              <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                {(pkg.items || []).slice(0, 3).join(' · ')}
                {(pkg.items?.length || 0) > 3 ? ` · +${pkg.items.length - 3} lainnya` : ''}
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-2">
              <div>
                <p className="text-base font-extrabold text-zinc-900 tabular-nums">
                  {formatRupiah(pkg.price)}
                  <span className="text-[11px] font-normal text-zinc-500">/pax</span>
                </p>
                <p className="text-[11px] text-zinc-400">Min. {pkg.minOrder} pax</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenDetailDrawer(pkg)}
                  className="inline-flex items-center gap-0.5 px-3 py-2 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  <span>Detail</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelectPackageForBooking(pkg)}
                  className="px-3.5 py-2 rounded-lg bg-brand-primary hover:bg-brand-dark text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Pilih
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
