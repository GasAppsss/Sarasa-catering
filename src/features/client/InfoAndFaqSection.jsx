import React, { useState } from 'react';
import { Award, ChevronDown, FileCheck2, HelpCircle, Quote, ShieldCheck, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';

export function InfoAndFaqSection() {
  const { config } = useApp();
  const { companyProfile, testimonials = [], faq = [], terms = [], featureFlags } = config;
  const [activeTab, setActiveTab] = useState('about');
  const [openFaqId, setOpenFaqId] = useState(faq[0]?.id || null);

  const tabs = [
    { id: 'about', label: 'Standar Mutu & Kapasitas Dapur', icon: Award, visible: true },
    { id: 'reviews', label: 'Portofolio & Testimoni Klien', icon: Quote, visible: featureFlags?.enableTestimonials !== false },
    { id: 'faq', label: 'FAQ & Syarat Pemesanan', icon: HelpCircle, visible: featureFlags?.enableFaqSection !== false },
  ].filter((t) => t.visible);

  return (
    <section id="info-faq-section" className="sc-container sc-section">
      <Reveal>
        <div className="bg-white rounded-[var(--sc-radius)] border border-stone-200/90 shadow-sm overflow-hidden">
          <div className="bg-brand-dark/95 text-white px-4 sm:px-6 pt-3 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-emerald-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-extrabold whitespace-nowrap rounded-t-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#FAF8F5] text-brand-dark shadow-sm'
                      : 'text-emerald-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-amber-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6 sm:p-8 bg-[#FAF8F5]/60">
            {activeTab === 'about' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start animate-card-reveal">
                <div className="lg:col-span-5 space-y-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Jaminan Kualitas Sajian</span>
                  </span>
                  <h2 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-brand-dark leading-tight">
                    {companyProfile?.headline}
                  </h2>
                  <p className="text-sm text-stone-600 leading-relaxed">{companyProfile?.summary}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(companyProfile?.certifications || []).map((cert) => (
                      <span
                        key={cert}
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-white border border-stone-200 px-3 py-1.5 rounded-xl text-emerald-950 shadow-sm"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{cert}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(companyProfile?.metrics || []).map((m, idx) => (
                    <div
                      key={m.label}
                      className={`rounded-2xl p-5 border transition-all hover:-translate-y-0.5 hover:shadow-md ${
                        idx === 0
                          ? 'bg-gradient-to-br from-emerald-900 to-emerald-950 text-white border-amber-400/40 shadow-lg'
                          : idx === 1
                            ? 'bg-gradient-to-br from-amber-50 to-amber-100/70 text-stone-900 border-amber-300'
                            : 'bg-white text-stone-800 border-stone-200'
                      }`}
                    >
                      <p
                        className={`text-2xl sm:text-3xl font-black tabular-nums ${
                          idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-amber-800' : 'text-brand-dark'
                        }`}
                      >
                        {m.value}
                      </p>
                      <p className={`text-sm font-extrabold mt-1 ${idx === 0 ? 'text-white' : 'text-stone-900'}`}>
                        {m.label}
                      </p>
                      <p className={`text-xs mt-1 leading-relaxed ${idx === 0 ? 'text-emerald-200' : 'text-stone-600'}`}>
                        {m.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-card-reveal">
                {testimonials.map((t) => (
                  <article
                    key={t.id}
                    className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                          <Quote className="w-4 h-4" />
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {t.rating}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                    </div>
                    <div className="pt-3 border-t border-stone-100">
                      <p className="font-extrabold text-sm text-brand-dark">{t.clientName}</p>
                      <p className="text-[11px] text-stone-500">{t.organization}</p>
                      <p className="text-[11px] font-bold text-emerald-800 mt-0.5">{t.eventType}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-card-reveal">
                <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 divide-y divide-stone-200">
                  {faq.map((item) => {
                    const isOpen = openFaqId === item.id;
                    return (
                      <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                        <button
                          type="button"
                          onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                          className="w-full flex items-center justify-between gap-3 text-left font-bold text-sm text-brand-dark cursor-pointer"
                        >
                          <span>{item.question}</span>
                          <ChevronDown
                            className={`w-4 h-4 text-amber-600 shrink-0 transition-transform ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">{item.answer}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="lg:col-span-5 bg-brand-dark text-white rounded-2xl p-6 shadow-lg border border-emerald-800 space-y-4">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                    <FileCheck2 className="w-4 h-4" />
                    <span>Syarat &amp; Ketentuan Resmi</span>
                  </div>
                  <h3 className="text-lg font-extrabold">Ketentuan Booking &amp; Pengiriman</h3>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-emerald-100">
                    {terms.map((term, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 bg-white/5 border border-white/10 rounded-xl p-3">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-emerald-950 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
