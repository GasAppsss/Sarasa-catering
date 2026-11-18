import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Flame,
  Package,
  Play,
  ShieldCheck,
  ShoppingBag,
  Star,
  ThumbsUp,
  UserCheck,
  Utensils,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatRupiah, getSplitTitle } from '../../utils/format.js';
import { Modal } from '../../components/ui/Modal.jsx';
import { TopDownPlateSVG } from '../../components/ui/PlateIllustration.jsx';
import { FloatingOrbs, MagneticButton } from '../../components/ui/Reveal.jsx';

export function HeroShowcase({
  activeIndex,
  onSelectIndex,
  onSelectPackageForBooking,
  onOpenTracker,
  onOpenClientPortal,
}) {
  const { packages, likedIds, toggleLikePackage, config } = useApp();
  const activePackages = useMemo(() => packages.filter((p) => p.isActive !== false), [packages]);
  const currentShowPkg = activePackages[activeIndex] || activePackages[0] || packages[0];
  const splitTitle = useMemo(() => getSplitTitle(currentShowPkg), [currentShowPkg]);

  const [animTriggerKey, setAnimTriggerKey] = useState(0);
  const [rightCardTab, setRightCardTab] = useState('overview');
  const [videoModalPkg, setVideoModalPkg] = useState(null);

  const handleSelect = (idx) => {
    onSelectIndex(idx);
    setAnimTriggerKey((p) => p + 1);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      if (e.key === 'ArrowRight') handleSelect(activeIndex + 1);
      else if (e.key === 'ArrowLeft') handleSelect(activeIndex - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!currentShowPkg) return null;
  const isLiked = Boolean(likedIds[currentShowPkg.id]);

  return (
    <section
      id="hero-showcase-section"
      className="relative overflow-hidden bg-gradient-to-br from-[#F7F5F0] via-[#EFECE4] to-[#E5E0D4] border-b border-stone-200/80 min-h-[650px] lg:min-h-[710px] flex flex-col justify-between"
    >
      <FloatingOrbs />

      <div className="pointer-events-none absolute top-0 right-14 hidden xl:flex flex-col items-center z-20 animate-float">
        <div className="w-[2px] h-28 bg-stone-800/70" />
        <div className="w-3 h-5 bg-amber-500 rounded-t-sm" />
        <div className="w-12 h-16 bg-brand-dark rounded-t-full shadow-xl border-b-2 border-amber-400/60" />
      </div>

      <div key={`ribbon-${animTriggerKey}`} className="pointer-events-none absolute inset-0 overflow-hidden z-0 animate-ribbon-arc">
        <svg viewBox="0 0 1440 800" fill="none" className="w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="sajianArcGrad" x1="65%" y1="0%" x2="15%" y2="75%">
              <stop offset="0%" stopColor={currentShowPkg.accentTint || '#064E3B'} stopOpacity="0.16" />
              <stop offset="55%" stopColor="#D97706" stopOpacity="0.14" />
              <stop offset="100%" stopColor={currentShowPkg.accentTint || '#064E3B'} stopOpacity="0.04" />
            </linearGradient>
          </defs>
          <path
            d="M 780 -80 C 660 180, 460 360, 260 390 C 140 408, 95 310, 150 220 C 220 110, 450 60, 560 -80 Z"
            fill="url(#sajianArcGrad)"
          />
          <path d="M 720 -40 C 610 190, 440 340, 250 360" stroke="#D97706" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.35" />
        </svg>
      </div>

      <div className="hidden lg:flex flex-col items-center gap-2.5 absolute left-5 top-1/2 -translate-y-1/2 z-20">
        {activePackages.map((p, idx) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleSelect(idx)}
            aria-label={`Pilih ${p.name}`}
            className={`rounded-full transition-all duration-300 cursor-pointer ${
              idx === activeIndex ? 'w-2 h-7 bg-brand-primary shadow-sm' : 'w-2 h-2 bg-stone-400/70 hover:bg-amber-600'
            }`}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 pt-8 sm:pt-10 pb-6 relative z-10 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          <div className="lg:col-span-4 flex items-center justify-center relative">
            <div className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full border border-amber-600/20 pointer-events-none animate-rotate-slow" />
            <div
              key={`plate-${animTriggerKey}`}
              className="animate-plate-arc cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => handleSelect(activeIndex + 1)}
              title="Klik piring untuk memutar ke paket hidangan berikutnya"
            >
              <TopDownPlateSVG styleType={currentShowPkg.plateStyle || 'buffet'} size="large" />
            </div>
          </div>

          <div className="lg:col-span-4 text-center lg:text-left flex flex-col items-center lg:items-start justify-center space-y-4">
            <div
              key={`rank-${animTriggerKey}`}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-600/30 text-amber-900 text-xs sm:text-sm font-bold tracking-wide animate-title-top"
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span>{currentShowPkg.rankLabel || '#1 Paket Pilihan Sajian'}</span>
            </div>

            <div className="overflow-hidden py-1">
              <h1 className="leading-[1.06] tracking-tight">
                <span
                  key={`line1-${animTriggerKey}`}
                  className="block text-3xl sm:text-4xl xl:text-[42px] font-extralight text-stone-700 uppercase animate-title-top"
                >
                  {splitTitle.line1}
                </span>
                <span
                  key={`line2-${animTriggerKey}`}
                  className="block text-4xl sm:text-5xl xl:text-[50px] font-black text-brand-dark uppercase tracking-tight mt-1 animate-title-bottom"
                >
                  {splitTitle.line2}
                </span>
              </h1>
            </div>

            <div
              key={`price-${animTriggerKey}`}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-2 animate-card-reveal"
            >
              <span className="px-3.5 py-1 rounded-xl bg-brand-dark text-amber-400 font-extrabold text-sm sm:text-base shadow-sm">
                {formatRupiah(currentShowPkg.price)}
                <span className="text-xs font-normal text-emerald-200"> / pax</span>
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/85 border border-stone-300 text-stone-700 text-xs font-bold">
                Min. Order {currentShowPkg.minOrder} Pax
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold">
                {currentShowPkg.category}
              </span>
            </div>

            {currentShowPkg.servingNote && (
              <p className="text-xs text-stone-600 font-medium">{currentShowPkg.servingNote}</p>
            )}

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              {config?.featureFlags?.enableVideoPreview !== false && (
                <MagneticButton
                  type="button"
                  onClick={() => setVideoModalPkg(currentShowPkg)}
                  className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/90 hover:bg-white text-stone-800 border border-stone-300 shadow-sm hover:shadow font-bold text-xs sm:text-sm transition-all"
                >
                  <span className="w-7 h-7 rounded-lg bg-brand-dark text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </span>
                  <span>Detail Penyajian</span>
                </MagneticButton>
              )}
              <MagneticButton
                type="button"
                onClick={() => onSelectPackageForBooking(currentShowPkg)}
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-brand-dark text-amber-300 font-extrabold text-xs sm:text-sm shadow-lg border border-amber-500/40 transition-all animate-glow"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Pesan Paket Ini</span>
              </MagneticButton>
            </div>
          </div>

          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-[var(--sc-radius)] border border-white shadow-[0_20px_50px_rgba(6,78,59,0.08)] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'ingredients', label: `Menu (${currentShowPkg.items?.length || 0})` },
                  { id: 'specs', label: 'Perlengkapan' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRightCardTab(tab.id)}
                    className={`text-xs sm:text-sm font-bold pb-1 transition-all relative cursor-pointer ${
                      rightCardTab === tab.id ? 'text-brand-dark' : 'text-stone-400 hover:text-stone-700'
                    }`}
                  >
                    {tab.label}
                    {rightCardTab === tab.id && (
                      <span className="absolute -bottom-[13px] left-0 right-0 h-0.5 bg-amber-500 rounded-full animate-grow-x" />
                    )}
                  </button>
                ))}
              </div>

              <div key={`card-${animTriggerKey}-${rightCardTab}`} className="animate-card-reveal">
                {rightCardTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-18 h-18 p-3 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-emerald-950 flex flex-col items-center justify-center shadow-lg shrink-0">
                        <span className="text-2xl font-black leading-none">{currentShowPkg.rating || '4.9'}</span>
                        <Star className="w-4 h-4 fill-emerald-950 text-emerald-950 mt-1" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-brand-dark leading-snug">{currentShowPkg.chefName}</h3>
                        <p className="text-xs font-medium text-amber-800">{currentShowPkg.chefTitle}</p>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-semibold mt-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Halal MUI &amp; SLHS Certified
                        </span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{currentShowPkg.chefQuote}</p>
                    <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => toggleLikePackage(currentShowPkg.id)}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isLiked
                            ? 'bg-brand-primary text-amber-300 shadow-sm'
                            : 'bg-stone-100 hover:bg-amber-100/70 text-stone-700'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{currentShowPkg.likes || 0} Suka</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRightCardTab('ingredients')}
                        className="text-xs font-bold text-emerald-800 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Lihat Lauk</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {rightCardTab === 'ingredients' && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Komposisi Hidangan:</p>
                    <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {(currentShowPkg.items || []).map((item, i) => (
                        <li
                          key={i}
                          className="text-xs text-stone-700 flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200/70"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => onSelectPackageForBooking(currentShowPkg)}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>Hitung Estimasi {currentShowPkg.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {rightCardTab === 'specs' && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                        Perlengkapan Termasuk:
                      </p>
                      <ul className="space-y-1.5">
                        {(currentShowPkg.equipment || []).map((eq, i) => (
                          <li key={i} className="text-xs text-stone-700 flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>{eq}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-stone-100">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Catatan Alergen:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(currentShowPkg.allergens?.length ? currentShowPkg.allergens : ['Bebas alergen umum']).map((al) => (
                          <span
                            key={al}
                            className="text-[11px] font-semibold bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full"
                          >
                            {al}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 pb-6 relative z-20 space-y-4">
        <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-4">
          <button
            type="button"
            aria-label="Paket sebelumnya"
            onClick={() => handleSelect(activeIndex - 1)}
            className="w-10 h-10 rounded-full bg-white/90 hover:bg-brand-dark text-stone-700 hover:text-amber-400 border border-stone-300 shadow-sm flex items-center justify-center transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-end gap-2.5 sm:gap-3.5 overflow-x-auto py-3 px-2 no-scrollbar">
            {activePackages.map((pkg, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleSelect(idx)}
                  className={`group relative flex flex-col items-center text-center transition-all duration-300 px-3 pt-2.5 pb-3 rounded-2xl min-w-[112px] sm:min-w-[126px] cursor-pointer ${
                    isActive
                      ? 'bg-white shadow-xl border-2 border-amber-400 -translate-y-2'
                      : 'bg-white/45 hover:bg-white/85 border border-transparent hover:border-stone-300'
                  }`}
                >
                  <div className={`transition-transform duration-500 ${isActive ? 'scale-110 rotate-12' : 'group-hover:scale-105'}`}>
                    <TopDownPlateSVG styleType={pkg.plateStyle} size="small" />
                  </div>
                  <span
                    className={`mt-2 text-xs leading-tight line-clamp-2 ${
                      isActive ? 'font-extrabold text-brand-dark' : 'font-medium text-stone-600'
                    }`}
                  >
                    {pkg.name}
                  </span>
                  <span className={`mt-1 text-[10px] font-bold ${isActive ? 'text-amber-700' : 'text-stone-500'}`}>
                    {formatRupiah(pkg.price)}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            aria-label="Paket berikutnya"
            onClick={() => handleSelect(activeIndex + 1)}
            className="w-10 h-10 rounded-full bg-white/90 hover:bg-brand-dark text-stone-700 hover:text-amber-400 border border-stone-300 shadow-sm flex items-center justify-center transition-all cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-7 pt-1">
          {[
            {
              icon: Utensils,
              label: 'Katalog Lengkap',
              onClick: () => document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' }),
            },
            {
              icon: Flame,
              label: 'Kalkulator & Stall',
              onClick: () => document.getElementById('booking-calculator-section')?.scrollIntoView({ behavior: 'smooth' }),
            },
            { icon: FileText, label: 'Lacak Cepat', onClick: onOpenTracker },
            { icon: UserCheck, label: 'Portal Klien', onClick: onOpenClientPortal },
          ].map(({ icon: Icon, label, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className="group flex items-center gap-2 text-stone-700 hover:text-brand-dark transition-colors cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-white/85 group-hover:bg-brand-dark group-hover:text-amber-400 border border-stone-300/80 shadow-sm transition-all">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">{label}</span>
            </button>
          ))}
          <MagneticButton
            type="button"
            aria-label="Lihat kalender ketersediaan"
            onClick={() => document.getElementById('capacity-calendar-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-11 h-11 rounded-full bg-brand-dark text-amber-400 shadow-xl border-2 border-amber-400 flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Calendar className="w-5 h-5" />
          </MagneticButton>
        </div>
      </div>

      <Modal isOpen={Boolean(videoModalPkg)} onClose={() => setVideoModalPkg(null)} maxWidth="max-w-xl">
        {videoModalPkg && (
          <div className="bg-brand-dark text-white rounded-3xl overflow-hidden shadow-2xl border border-amber-400/40">
            <div className="p-5 bg-black/20 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-brand-accent text-brand-dark flex items-center justify-center">
                  <Play className="w-4 h-4 fill-current" />
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-white">Standar Setup: {videoModalPkg.name}</h3>
                  <p className="text-xs text-emerald-300">
                    Dokumentasi Setup: {videoModalPkg.videoDuration || '02:00'} • {videoModalPkg.servingNote}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup modal detail"
                onClick={() => setVideoModalPkg(null)}
                className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="rounded-2xl bg-black/25 border border-white/15 p-5 flex flex-col sm:flex-row items-center gap-5">
                <div className="animate-rotate-slow">
                  <TopDownPlateSVG styleType={videoModalPkg.plateStyle} size="small" />
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-brand-accent text-brand-dark">
                    Kurasi Eksklusif
                  </span>
                  <h4 className="text-base font-extrabold text-white">{videoModalPkg.chefName}</h4>
                  <p className="text-xs text-emerald-200 leading-relaxed">{videoModalPkg.chefQuote}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Fasilitas &amp; Perlengkapan Penyajian:
                </p>
                {(videoModalPkg.videoHighlights || videoModalPkg.equipment || []).map((hl, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm bg-white/10 border border-white/10 px-3.5 py-2.5 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVideoModalPkg(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-200 hover:text-white cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = videoModalPkg;
                    setVideoModalPkg(null);
                    onSelectPackageForBooking(target);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-brand-accent text-brand-dark font-extrabold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Pesan Paket Ini</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
