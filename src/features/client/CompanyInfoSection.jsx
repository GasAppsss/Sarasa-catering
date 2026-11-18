import React from 'react';
import { Award, Quote, ShieldCheck, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';

export function CompanyInfoSection() {
  const { config } = useApp();
  const { companyProfile, testimonials, featureFlags } = config;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 space-y-10">
      <Reveal>
        <div className="bg-white rounded-[var(--sc-radius)] border border-stone-200/90 p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>Profil &amp; Standar Mutu</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-dark leading-tight">
                {companyProfile?.headline}
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed">{companyProfile?.summary}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {(companyProfile?.certifications || []).map((cert) => (
                  <span
                    key={cert}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#FAF8F5] border border-stone-200 px-3 py-1.5 rounded-xl text-emerald-950"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{cert}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(companyProfile?.metrics || []).map((m, idx) => (
                <div
                  key={m.label}
                  className={`rounded-2xl p-5 border transition-shadow hover:shadow-md ${
                    idx === 0
                      ? 'bg-brand-dark text-white border-emerald-900'
                      : 'bg-[#FAF8F5] text-stone-800 border-stone-200'
                  }`}
                >
                  <p className={`text-2xl sm:text-3xl font-black tabular-nums ${idx === 0 ? 'text-amber-400' : 'text-brand-dark'}`}>
                    {m.value}
                  </p>
                  <p className={`text-sm font-bold mt-1 ${idx === 0 ? 'text-white' : 'text-stone-900'}`}>{m.label}</p>
                  <p className={`text-xs mt-1 leading-relaxed ${idx === 0 ? 'text-emerald-200' : 'text-stone-600'}`}>
                    {m.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {featureFlags?.enableTestimonials !== false && testimonials?.length > 0 && (
        <Reveal delay={80}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                  Portofolio &amp; Ulasan Klien
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-brand-dark mt-2">
                  Dipercaya Ratusan Acara Korporat &amp; Keluarga
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {testimonials.map((t) => (
                <article
                  key={t.id}
                  className="bg-white rounded-[var(--sc-radius)] border border-stone-200 p-5 shadow-sm flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Quote className="w-5 h-5 text-amber-500" />
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {t.rating}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  </div>
                  <div className="pt-3 border-t border-stone-100">
                    <p className="font-bold text-sm text-brand-dark">{t.clientName}</p>
                    <p className="text-[11px] text-stone-500">{t.organization}</p>
                    <p className="text-[11px] font-semibold text-emerald-800 mt-0.5">{t.eventType}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </section>
  );
}
