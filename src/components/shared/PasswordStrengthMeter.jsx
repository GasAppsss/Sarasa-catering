import React from 'react';
import { Check, Circle } from 'lucide-react';
import { evaluatePasswordStrength } from '../../../backend/src/shared/passwordPolicy.js';

const SCORE_COLORS = [
  'bg-stone-200',
  'bg-rose-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-emerald-700',
];

const LABEL_COLORS = [
  'text-stone-400',
  'text-rose-600',
  'text-amber-600',
  'text-emerald-700',
  'text-emerald-800',
];

export function PasswordStrengthMeter({ password = '' }) {
  const { score, label, rules } = evaluatePasswordStrength(password);

  const checks = [
    { key: 'minLength', text: 'Minimal 8 karakter', ok: rules.minLength },
    { key: 'case', text: 'Huruf besar & kecil', ok: rules.hasUpper && rules.hasLower },
    { key: 'numSym', text: 'Angka atau simbol', ok: rules.hasNumber || rules.hasSymbol },
  ];

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-stone-500">Kekuatan Password</span>
        <span className={`font-bold ${LABEL_COLORS[score] || 'text-stone-500'}`}>{label}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              score >= step ? SCORE_COLORS[score] : 'bg-stone-200'
            }`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
        {checks.map((item) => (
          <span
            key={item.key}
            className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${
              item.ok ? 'text-emerald-700' : 'text-stone-400'
            }`}
          >
            {item.ok ? <Check className="w-3 h-3 shrink-0" /> : <Circle className="w-2.5 h-2.5 shrink-0" />}
            <span>{item.text}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
