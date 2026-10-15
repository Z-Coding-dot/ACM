import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe2, ChevronDown, Check } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Locale } from '../../types/domain';
const languages: Locale[] = ['en', 'fa-AF'];
export function LanguageDropdown({ disabled = false }: { disabled?: boolean }) {
  const { t, i18n } = useTranslation(); const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), items = useRef<(HTMLButtonElement | null)[]>([]);
  const reduced = useReducedMotion();
  const close = (focus = false) => { setOpen(false); if (focus) trigger.current?.focus(); };
  useEffect(() => { if (!open) return; const handler = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener('pointerdown', handler); items.current[languages.indexOf(i18n.language as Locale)]?.focus(); return () => document.removeEventListener('pointerdown', handler); }, [open, i18n.language]);
  return <div className="language-dropdown" ref={root} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }} onKeyDown={e => {
    if (disabled) return;
    if (e.key === 'Escape') { e.preventDefault(); close(true); }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault(); if (!open) { setOpen(true); return; }
      const current = items.current.indexOf(document.activeElement as HTMLButtonElement);
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? 1 : (current + (e.key === 'ArrowDown' ? 1 : -1) + 2) % 2;
      items.current[next]?.focus();
    }
  }}>
    <button disabled={disabled} className="language-trigger" ref={trigger} aria-label={t('language.label')} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}><Globe2 size={17} aria-hidden="true" /><span>{t(`language.${i18n.language}`)}</span><ChevronDown size={14} aria-hidden="true" /></button>
    <AnimatePresence>{open && <motion.div className="language-menu" role="menu" aria-label={t('language.label')} initial={{ opacity: 0, scale: reduced ? 1 : .97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .12 }}>{languages.map((locale, index) => <button key={locale} role="menuitemradio" aria-checked={locale === i18n.language} tabIndex={-1} ref={node => { items.current[index] = node; }} onClick={() => { void i18n.changeLanguage(locale); close(true); }}><span lang={locale} dir={locale === 'en' ? 'ltr' : 'rtl'}>{t(`language.${locale}`)}</span>{i18n.language === locale && <Check size={16} aria-hidden="true" />}</button>)}</motion.div>}</AnimatePresence>
  </div>;
}
