import React from 'react';
import { Lock, Mail, MapPin, Phone, Utensils } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export function Footer({ onOpenTeamAuth }) {
  const { config, backendStatus } = useApp();
  const { brand, business } = config;

  return (
    <footer className="no-print bg-white border-t border-zinc-200 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-brand-primary text-white flex items-center justify-center">
                <Utensils className="w-3.5 h-3.5" />
              </span>
              <span className="font-bold text-sm text-zinc-900">{brand?.name || 'SAJIAN CATERING'}</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">{brand?.tagline}</p>
            <p className="text-[11px] text-zinc-400">
              Status Sistem: {backendStatus === 'connected' ? 'API Server Terhubung' : 'Mode Demo Lokal'}
            </p>
          </div>

          <div className="space-y-2 text-xs text-zinc-600">
            <h3 className="font-semibold text-zinc-900">Kontak &amp; Dapur Pusat</h3>
            <p className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
              <span>{business?.address}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>{business?.phoneDisplay} · {business?.instagram}</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>{business?.email}</span>
            </p>
          </div>

          <div className="space-y-2 text-xs text-zinc-600">
            <h3 className="font-semibold text-zinc-900">Layanan &amp; Rekening</h3>
            <p>{business?.operatingHours}</p>
            <p>{business?.serviceArea}</p>
            <p className="text-zinc-500">
              {business?.bankName} <span className="font-mono text-zinc-800">{business?.bankAccountNumber}</span> a.n.{' '}
              {business?.bankAccountHolder}
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <h3 className="font-semibold text-zinc-900">Akses Internal Tim</h3>
            <p className="text-zinc-500 leading-relaxed">
              Portal khusus Admin Dapur, Administrator Bisnis, dan Pengembang sistem.
            </p>
            <button
              type="button"
              onClick={onOpenTeamAuth}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Login Portal Tim &amp; Dapur</span>
            </button>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-400">
          <p>&copy; {new Date().getFullYear()} {brand?.name || 'Sajian Catering'}. All rights reserved.</p>
          <p>
            Pengembang:{' '}
            <kbd className="px-1.5 py-0.5 rounded border border-zinc-200 bg-zinc-50 font-mono text-zinc-600">
              Ctrl+Shift+D
            </kbd>
          </p>
        </div>
      </div>
    </footer>
  );
}
