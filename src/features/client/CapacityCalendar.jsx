import React from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatTanggalIndo } from '../../utils/format.js';
import { Reveal } from '../../components/ui/Reveal.jsx';

export function CapacityCalendar({ selectedDate, onSelectDate, onErrorMessage }) {
  const { calendarDates, config } = useApp();
  const dailyMaxPax = config.business?.dailyMaxPax || 600;

  return (
    <section id="capacity-calendar-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
      <Reveal>
        <div className="bg-white rounded-[var(--sc-radius)] border border-stone-200/90 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Kalender Kapasitas Dapur Real-Time (Max {dailyMaxPax} pax/hari)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-brand-dark mt-1">
                Cek Ketersediaan Tanggal Acara (14 Hari ke Depan)
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                Klik tanggal yang tersedia untuk langsung mengunci jadwal pada kalkulator pesanan.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              {[
                { label: 'Tersedia', color: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
                { label: 'Slot Terbatas', color: 'bg-amber-500', bg: 'bg-amber-50 border-amber-200 text-amber-900' },
                { label: 'Fully Booked', color: 'bg-rose-500', bg: 'bg-rose-50 border-rose-200 text-rose-900' },
              ].map(({ label, color, bg }) => (
                <span key={label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${bg}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {calendarDates.map((d) => {
              const isSelected = d.dateStr === selectedDate;
              const isFull = d.status === 'Penuh';
              const isLimited = d.status === 'Slot Terbatas';
              return (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => {
                    onSelectDate(d.dateStr);
                    onErrorMessage(
                      isFull
                        ? `Tanggal ${formatTanggalIndo(d.dateStr)} sudah Fully Booked. Silakan pilih tanggal lain.`
                        : ''
                    );
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isFull
                      ? 'bg-rose-50/80 border-rose-200 text-rose-900 opacity-85 hover:opacity-100'
                      : isSelected
                        ? 'bg-brand-dark border-amber-400 text-white shadow-lg scale-[1.02]'
                        : isLimited
                          ? 'bg-amber-50/70 border-amber-200 hover:border-amber-500 text-stone-800'
                          : 'bg-[#FAF8F5] border-stone-200 hover:border-emerald-700 text-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-stone-500'}`}>
                      {d.dayName}
                    </span>
                    {isSelected && !isFull && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div className="my-1.5">
                    <span className="text-lg font-black">{d.dayNum}</span>{' '}
                    <span className="text-xs font-semibold">{d.monthShort}</span>
                  </div>
                  <span
                    className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md w-fit ${
                      isFull
                        ? 'bg-rose-200 text-rose-900'
                        : isSelected
                          ? 'bg-amber-400 text-emerald-950'
                          : isLimited
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    {isFull ? 'Fully Booked' : d.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
