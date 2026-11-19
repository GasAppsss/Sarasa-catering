import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export function FloatingWhatsAppButton() {
  const { config } = useApp();
  const waNumber = String(config?.business?.whatsappNumber || '628569000604').replace(/\D/g, '');
  const brandName = config?.brand?.name || 'Sajian Catering';

  if (!waNumber) return null;

  const message = encodeURIComponent(
    `Halo Admin ${brandName}, saya ingin konsultasi paket catering dan ketersediaan jadwal acara.`
  );
  const href = `https://wa.me/${waNumber}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Konsultasi via WhatsApp ${brandName}`}
      className="no-print fixed bottom-5 right-5 z-40 group inline-flex items-center gap-2.5 pl-3.5 pr-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-950/30 border border-emerald-400/40 transition-all hover:scale-105 active:scale-95"
    >
      <span className="relative flex h-6 w-6 items-center justify-center">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-50" />
        <MessageCircle className="relative w-5 h-5 fill-white/15" />
      </span>
      <span className="hidden sm:inline text-xs font-extrabold tracking-wide">Chat WhatsApp</span>
    </a>
  );
}
