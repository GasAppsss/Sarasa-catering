import React, { useCallback, useEffect, useRef, useState } from 'react';

export function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px', ...options }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}

export function useCountUp(target, duration = 1100) {
  const [value, setValue] = useState(0);
  const rafRef = useRef();

  useEffect(() => {
    const start = performance.now();
    const to = Number(target) || 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.floor(to * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

export function useMagnetic(strength = 10) {
  const ref = useRef(null);
  const handleMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${(x / r.width) * strength}px, ${(y / r.height) * strength}px)`;
    },
    [strength]
  );
  const handleLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = 'translate(0,0)';
  }, []);
  return { ref, onMouseMove: handleMove, onMouseLeave: handleLeave };
}

export function Reveal({ children, delay = 0, y = 20, className = '', as: Tag = 'div' }) {
  const [ref, visible] = useScrollReveal();
  return (
    <Tag
      ref={ref}
      className={`reveal-base ${visible ? 'reveal-in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, '--reveal-y': `${y}px` }}
    >
      {children}
    </Tag>
  );
}

export function AnimatedCounter({ value, prefix = 'Rp ', className = '' }) {
  const [ref, visible] = useScrollReveal();
  const n = useCountUp(visible ? value : 0, 950);
  return (
    <span ref={ref} className={className}>
      {prefix}
      {new Intl.NumberFormat('id-ID').format(n)}
    </span>
  );
}

export function MagneticButton({ children, className = '', as = 'button', ...props }) {
  const m = useMagnetic(8);
  const Tag = as;
  return (
    <Tag {...m} className={`magnetic-btn cursor-pointer ${className}`} {...props}>
      {children}
    </Tag>
  );
}

export function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="orb orb-emerald" />
      <div className="orb orb-amber" />
      <div className="orb orb-gold" />
    </div>
  );
}
