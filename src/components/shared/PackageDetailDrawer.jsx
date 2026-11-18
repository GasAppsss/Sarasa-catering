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
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex justify-end animate-backdrop-zoom"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl border-l border-zinc-200 flex flex-col justify-between animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-4">
            <div>
              <span className="text-[11px] font-semibold text-brand-primary bg-emerald-50 px-2.5 py-0.5 rounded-full">
                {pkg.category} · Min. {pkg.minOrder} Pax
              </span>
              <h2 className="text-xl font-bold text-zinc-900 mt-2">{pkg.name}</h2>
              {pkg.servingNote && <p className="text-xs text-zinc-500 mt-0.5">{pkg.servingNote}</p>}
            </div>
            <button
              type="button"
              aria-label="Tutup detail paket"
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 p-4">
            <TopDownPlateSVG styleType={pkg.plateStyle} size="medium" />
            <div className="space-y-1 flex-1">
              <p className="text-lg font-extrabold text-zinc-900">
                {formatRupiah(pkg.price)}
                <span className="text-xs font-normal text-zinc-500"> / pax</span>
              </p>
              <p className="text-xs font-semibold text-zinc-700">{pkg.chefName}</p>
              <p className="text-[11px] text-zinc-500">{pkg.chefTitle}</p>
              <div className="flex items-center gap-3 pt-1 text-xs">
                <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {pkg.rating}
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Halal &amp; SLHS
                </span>
              </div>
            </div>
          </div>

          {pkg.chefQuote && (
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed italic border-l-2 border-zinc-300 pl-3">
              &ldquo;{pkg.chefQuote}&rdquo;
            </p>
          )}

          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Komposisi Hidangan ({pkg.items?.length || 0} Item)
            </h3>
            <ul className="space-y-2">
              {(pkg.items || []).map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-800 bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-100"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {pkg.equipment?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Perlengkapan &amp; Layanan Termasuk
              </h3>
              <ul className="space-y-1.5">
                {pkg.equipment.map((eq) => (
                  <li key={eq} className="flex items-center gap-2 text-xs text-zinc-700">
                    <Package className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{eq}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Informasi Alergen</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(pkg.allergens?.length ? pkg.allergens : ['Tidak ada alergen utama']).map((al) => (
                <span
                  key={al}
                  className="text-xs font-medium bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-full"
                >
                  {al}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-zinc-200 bg-white sticky bottom-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => toggleLikePackage(pkg.id)}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              isLiked
                ? 'bg-emerald-50 border-emerald-200 text-brand-primary'
                : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{pkg.likes || 0}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectPackage(pkg);
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-dark text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            <span>Pilih Paket Ini untuk Pesan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
