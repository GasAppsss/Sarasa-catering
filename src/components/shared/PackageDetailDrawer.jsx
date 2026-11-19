import React, { useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Package,
  ShieldCheck,
  Star,
  ThumbsUp,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatRupiah } from '../../utils/format.js';
import { TopDownPlateSVG } from '../ui/PlateIllustration.jsx';

export function PackageDetailDrawer({ pkg, onClose, onSelectPackage }) {
  const { likedIds, toggleLikePackage } = useApp();

  useEffect(() => {
    if (!pkg) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pkg, onClose]);

  if (!pkg) return null;
  const isLiked = Boolean(likedIds[pkg.id]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detail paket ${pkg.name}`}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-backdrop-zoom"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FAF8F5] h-full overflow-y-auto shadow-2xl border-l border-amber-400/30 flex flex-col justify-between animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="bg-brand-dark text-white p-6 relative overflow-hidden border-b border-emerald-800">
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-amber-400/15 blur-2xl pointer-events-none" />
            <div className="flex items-start justify-between gap-4 relative z-10">
              <div>
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-400 text-emerald-950">
                  {pkg.category} • Min. {pkg.minOrder} Pax
                </span>
                <h2 className="text-xl font-extrabold text-white mt-2">{pkg.name}</h2>
                {pkg.servingNote && <p className="text-xs text-emerald-200 mt-1">{pkg.servingNote}</p>}
              </div>
              <button
                type="button"
                aria-label="Tutup detail paket"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 rounded-2xl bg-white border border-stone-200 p-4 shadow-sm">
              {pkg.imageUrl ? (
                <img
                  src={pkg.imageUrl}
                  alt={pkg.name}
                  className="w-24 h-24 rounded-2xl object-cover border border-amber-200 shadow-sm shrink-0"
                />
              ) : (
                <div className="animate-rotate-slow">
                  <TopDownPlateSVG styleType={pkg.plateStyle} size="medium" />
                </div>
              )}
              <div className="space-y-1 flex-1">
                <p className="text-xl font-black text-brand-dark tabular-nums">
                  {formatRupiah(pkg.price)}
                  <span className="text-xs font-normal text-stone-500"> / pax</span>
                </p>
                <p className="text-xs font-bold text-stone-800">{pkg.chefName}</p>
                <p className="text-[11px] text-amber-800 font-semibold">{pkg.chefTitle}</p>
                <div className="flex items-center gap-3 pt-1 text-xs">
                  <span className="inline-flex items-center gap-1 font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {pkg.rating}
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Halal &amp; SLHS
                  </span>
                </div>
              </div>
            </div>

            {pkg.chefQuote && (
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed italic bg-white p-4 rounded-2xl border border-stone-200/80">
                &ldquo;{pkg.chefQuote}&rdquo;
              </p>
            )}

            <div className="space-y-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-dark">
                Komposisi Hidangan ({pkg.items?.length || 0} Menu)
              </h3>
              <ul className="space-y-2">
                {(pkg.items || []).map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2.5 text-xs sm:text-sm text-stone-800 bg-white px-3.5 py-2.5 rounded-xl border border-stone-200/80 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {pkg.equipment?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-dark">
                  Perlengkapan &amp; Fasilitas Saji
                </h3>
                <ul className="space-y-1.5">
                  {pkg.equipment.map((eq) => (
                    <li
                      key={eq}
                      className="flex items-center gap-2 text-xs text-stone-700 bg-emerald-50/70 border border-emerald-200/70 px-3 py-2 rounded-xl"
                    >
                      <Package className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="font-medium">{eq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Informasi Alergen</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {(pkg.allergens?.length ? pkg.allergens : ['Tidak ada alergen utama']).map((al) => (
                  <span
                    key={al}
                    className="text-xs font-bold bg-amber-100/80 border border-amber-300 text-amber-950 px-3 py-1 rounded-full"
                  >
                    {al}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-stone-200 bg-white sticky bottom-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => toggleLikePackage(pkg.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isLiked
                ? 'bg-brand-dark text-amber-300 shadow-sm'
                : 'bg-stone-100 hover:bg-amber-100/70 text-stone-700'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{pkg.likes || 0} Suka</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectPackage(pkg);
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 font-extrabold text-xs sm:text-sm shadow-md shimmer-btn cursor-pointer"
          >
            <span>Pilih Paket Ini untuk Pesan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
