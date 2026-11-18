import React, { useState } from 'react';
import { ChevronDown, FileCheck2, HelpCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';

export function FaqAndTermsSection() {
  const { config } = useApp();
  const { faq = [], terms = [], featureFlags } = config;
  const [openId, setOpenId] = useState(faq[0]?.id || null);

  if (featureFlags?.enableFaqSection === false) return null;

  return (
    <section id="faq-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
      <Reveal>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white rounded-[var(--sc-radius)] border border-stone-200 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Pertanyaan Umum (FAQ)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-brand-dark">Informasi Pemesanan &amp; Layanan</h2>
            <div className="divide-y divide-stone-200">
              {faq.map((item) => {
                const isOpen = openId === item.id;
                return (
                  <div key={item.id} className="py-3">
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : item.id)}
                      className="w-full flex items-center justify-between gap-3 text-left font-bold text-sm text-brand-dark cursor-pointer"
                    >
                      <span>{item.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-stone-500 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">{item.answer}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 bg-brand-dark text-white rounded-[var(--sc-radius)] p-6 sm:p-7 shadow-lg space-y-4">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
              <FileCheck2 className="w-4 h-4" />
              <span>Syarat &amp; Ketentuan Resmi</span>
            </div>
            <h3 className="text-xl font-extrabold">Ketentuan Booking &amp; Pengiriman</h3>
            <ul className="space-y-3 text-xs sm:text-sm text-emerald-100">
              {terms.map((term, idx) => (
                <li key={idx} className="flex items-start gap-2.5 bg-white/5 border border-white/10 rounded-xl p-3">
                  <span className="w-5 h-5 rounded-full bg-brand-accent text-brand-dark font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{term}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
