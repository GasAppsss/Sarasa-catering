import React, { useMemo } from 'react';
import { ArrowRight, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatRupiah, getSplitTitle } from '../../utils/format.js';
import { TopDownPlateSVG } from '../../components/ui/PlateIllustration.jsx';

export function HeroShowcase({
  activeIndex,
  onSelectIndex,
  onSelectPackageForBooking,
  onOpenDetailDrawer,
}) {
  const { packages, config } = useApp();
  const activePackages = useMemo(() => packages.filter((p) => p.isActive !== false), [packages]);
  const currentPkg = activePackages[activeIndex] || activePackages[0] || packages[0];
  const splitTitle = useMemo(() => getSplitTitle(currentPkg), [currentPkg]);

  if (!currentPkg) return null;

  return (
    <section id="hero-showcase-section" className="border-b border-zinc-200/80 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Halal MUI &amp; SLHS Kemenkes Certified</span>
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-zinc-900 leading-[1.12]">
              Hidangan Istimewa untuk Setiap Momen Penting Anda
            </h1>

            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-xl">
              {config.companyProfile?.summary ||
                'Sajian Catering menghadirkan menu Nusantara autentik dengan jadwal pengiriman presisi, standar higiene dapur sentral, dan estimasi biaya transparan.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onSelectPackageForBooking(currentPkg)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-primary hover:bg-brand-dark text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                <span>Mulai Hitung &amp; Pesan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 font-semibold text-sm transition-colors cursor-pointer"
              >
                <span>Jelajahi Menu</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1.5 font-medium text-zinc-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> 99.4% Tepat Waktu
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-zinc-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Mulai 25 Pax
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-zinc-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Layanan Jabodetabek
              </span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Paket Pilihan
                </span>
                <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  {currentPkg.category} · Min. {currentPkg.minOrder} Pax
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div
                  key={currentPkg.id}
                  className="animate-plate-arc shrink-0 cursor-pointer"
                  onClick={() => onOpenDetailDrawer(currentPkg)}
                  title="Klik untuk melihat rincian menu"
                >
                  <TopDownPlateSVG styleType={currentPkg.plateStyle} size="medium" />
                </div>
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">
                    {splitTitle.line1} {splitTitle.line2}
                  </h2>
                  <p className="text-lg font-extrabold text-brand-primary tabular-nums">
                    {formatRupiah(currentPkg.price)}
                    <span className="text-xs font-normal text-zinc-500"> / pax</span>
                  </p>
                  <p className="text-xs text-zinc-600 line-clamp-2">{currentPkg.servingNote}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200/80 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-700">Highlight Menu Utama</span>
                  <button
                    type="button"
                    onClick={() => onOpenDetailDrawer(currentPkg)}
                    className="inline-flex items-center gap-1 font-semibold text-brand-primary hover:underline cursor-pointer"
                  >
                    <span>Detail Lengkap ({currentPkg.items?.length || 0})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {(currentPkg.items || []).slice(0, 4).join(' · ')}
                </p>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                {activePackages.map((pkg, idx) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => onSelectIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      idx === activeIndex
                        ? 'bg-zinc-900 text-white'
                        : 'bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {pkg.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
