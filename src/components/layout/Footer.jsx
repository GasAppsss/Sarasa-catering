import React from 'react';
import { Clock, Lock, Mail, MapPin, Phone, ShieldCheck, Utensils } from 'lucide-react';
import { ROLES } from '../../config/rbac.js';
import { useApp } from '../../context/AppContext.jsx';

export function Footer({ onOpenTeamAuth }) {
  const { config } = useApp();
  const { brand, business, companyProfile } = config;

  return (
    <footer className="no-print bg-brand-dark text-emerald-100 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-accent text-brand-dark flex items-center justify-center">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-white tracking-wide">{brand?.name || 'SAJIAN CATERING'}</p>
                <p className="text-[11px] text-amber-300">{brand?.badgeText}</p>
              </div>
            </div>
            <p className="text-xs text-emerald-200/85 leading-relaxed">{brand?.tagline}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(companyProfile?.certifications || []).slice(0, 2).map((cert) => (
                <span
                  key={cert}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white/10 border border-white/15 px-2.5 py-1 rounded-full text-amber-200"
                >
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  {cert}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">Kontak &amp; Dapur Pusat</h3>
            <p className="flex items-start gap-2 text-emerald-200/90">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{business?.address}</span>
            </p>
            <p className="flex items-center gap-2 text-emerald-200/90">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{business?.phoneDisplay} ({business?.instagram})</span>
            </p>
            <p className="flex items-center gap-2 text-emerald-200/90">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{business?.email}</span>
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">Operasional &amp; Cakupan</h3>
            <p className="flex items-start gap-2 text-emerald-200/90">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{business?.operatingHours}</span>
            </p>
            <p className="text-emerald-200/85">
              <strong className="text-white">Area Layanan:</strong> {business?.serviceArea}
            </p>
            <p className="text-emerald-200/85">
              <strong className="text-white">Rekening DP Resmi:</strong> {business?.bankName} {business?.bankAccountNumber} a.n.{' '}
              {business?.bankAccountHolder}
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">Portal Internal</h3>
            <p className="text-emerald-200/80 leading-relaxed">
              Akses khusus untuk Administrator Bisnis dan Tim Operasional Dapur {brand?.name || 'Sajian Catering'}.
            </p>
            <button
              type="button"
              onClick={() => onOpenTeamAuth?.(ROLES.ADMIN)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-amber-300 font-bold text-xs transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Portal Internal Tim</span>
            </button>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-emerald-300/75">
          <p>&copy; {new Date().getFullYear()} {brand?.name || 'Sajian Catering'}. Seluruh hak cipta dilindungi.</p>
          <p className="text-emerald-200/70">Dapur Higienis • Layanan Profesional Jabodetabek</p>
        </div>
      </div>
    </footer>
  );
}
