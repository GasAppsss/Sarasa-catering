import React, { useState } from 'react';
import { ChevronDown, ShieldCheck, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export function InfoAndFaqSection() {
  const { config } = useApp();
  const { companyProfile, testimonials = [], faq = [], terms = [], featureFlags } = config;
  const [activeTab, setActiveTab] = useState('about');
  const [openFaqId, setOpenFaqId] = useState(faq[0]?.id || null);

  return (
    <section id="info-faq-section" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="border-b border-zinc-200 px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'about', label: 'Tentang & Standar Mutu', visible: true },
            { id: 'reviews', label: 'Ulasan Klien', visible: featureFlags?.enableTestimonials !== false },
            { id: 'faq', label: 'FAQ & Ketentuan', visible: featureFlags?.enableFaqSection !== false },
          ]
            .filter((t) => t.visible)
            .map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab.id ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-primary rounded-full" />
                )}
              </button>
            ))}
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 leading-snug">
                  {companyProfile?.headline}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">{companyProfile?.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {(companyProfile?.certifications || []).map((cert) => (
                    <span
                      key={cert}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-lg text-zinc-700"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(companyProfile?.metrics || []).map((m) => (
                  <div key={m.label} className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-1">
                    <p className="text-2xl font-extrabold text-brand-primary tabular-nums">{m.value}</p>
                    <p className="text-xs font-bold text-zinc-900">{m.label}</p>
                    <p className="text-[11px] text-zinc-500">{m.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {testimonials.map((t) => (
                <article
                  key={t.id}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {t.rating}
                    </span>
                    <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  </div>
                  <div className="pt-3 border-t border-zinc-200/70">
                    <p className="font-bold text-xs text-zinc-900">{t.clientName}</p>
                    <p className="text-[11px] text-zinc-500">{t.organization}</p>
                    <p className="text-[11px] font-medium text-brand-primary mt-0.5">{t.eventType}</p>
                  </div>
                </article>
              ))}
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 divide-y divide-zinc-200">
                {faq.map((item) => {
                  const isOpen = openFaqId === item.id;
                  return (
                    <div key={item.id} className="py-3 first:pt-0">
                      <button
                        type="button"
                        onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                        className="w-full flex items-center justify-between gap-3 text-left font-semibold text-sm text-zinc-900 cursor-pointer"
                      >
                        <span>{item.question}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="mt-2 text-xs sm:text-sm text-zinc-600 leading-relaxed">{item.answer}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="lg:col-span-5 rounded-xl bg-zinc-50 border border-zinc-200 p-5 space-y-3">
                <h3 className="font-bold text-sm text-zinc-900">Syarat &amp; Ketentuan Singkat</h3>
                <ul className="space-y-2.5 text-xs text-zinc-600">
                  {terms.map((term, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="font-mono font-bold text-brand-primary">{idx + 1}.</span>
                      <span>{term}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
