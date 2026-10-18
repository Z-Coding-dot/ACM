import { Children, cloneElement, isValidElement, type ReactNode, type InputHTMLAttributes, useId, useRef, useLayoutEffect, useEffect } from 'react';
import { m, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { uiSpring } from '../../lib/motion';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CalendarCheck2, X, LoaderCircle } from 'lucide-react';
import { errorKey } from '../../services/errors';
import type { AppointmentStatus } from '../../types/domain';

export function Button({ variant = 'primary', className = '', children, ...props }: HTMLMotionProps<'button'> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const reduced = useReducedMotion();
  return <m.button type="button" whileHover={!reduced && !props.disabled ? { y: -1 } : undefined} whileTap={!reduced && !props.disabled ? { scale: .98 } : undefined} transition={uiSpring} className={`button button-${variant} ${className}`} {...props}>{children}</m.button>;
}
export function Field({ label, error, hint, children, id }: { label: string; error?: string; hint?: string; children: ReactNode; id: string }) {
  const { t } = useTranslation();
  const description = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const connect = (nodes: ReactNode): ReactNode => Children.map(nodes, child => {
    if (!isValidElement<{ id?: string; children?: ReactNode; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>(child)) return child;
    if (child.props.id === id) return cloneElement(child, { 'aria-invalid': !!error, 'aria-describedby': description });
    return child.props.children ? cloneElement(child, { children: connect(child.props.children) }) : child;
  });
  return <div className={`field ${error ? 'has-error' : ''}`}><label htmlFor={id}>{label}</label>{connect(children)}{hint && <small id={`${id}-hint`}>{hint}</small>}{error && <small className="field-error" id={`${id}-error`} role="alert">{t(error)}</small>}</div>;
}
export function Input(props: InputHTMLAttributes<HTMLInputElement>) { return <input className="input" {...props} />; }
export function PageHeading({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  const reduced = useReducedMotion();
  const route = `${window.location.pathname}${window.location.hash}`;
  useEffect(() => {
    // A lazy page finishing must not dismiss a menu or dialog the user opened meanwhile.
    if (document.activeElement?.closest('.language-dropdown, dialog')) return;
    const anchor = window.location.hash ? document.getElementById(window.location.hash.slice(1)) : null;
    if (anchor) { anchor.tabIndex = -1; anchor.scrollIntoView({ block: 'start' }); anchor.focus({ preventScroll: true }); }
    else document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [route]);
  return <m.div className="page-heading" initial={{ y: reduced ? 0 : 8 }} animate={{ y: 0 }} transition={uiSpring}><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</m.div>;
}
export function StatusBadge({ status }: { status: AppointmentStatus }) { const { t } = useTranslation(); return <span className={`status status-${status}`}><span className="status-dot" />{t(`status.${status}`)}</span>; }
export function EmptyState({ title, description, action }: { title?: string; description?: string; action?: ReactNode }) { const { t } = useTranslation(); return <div className="empty-state"><CalendarCheck2 size={28} aria-hidden="true" /><h3>{title || t('common.empty')}</h3>{description && <p>{description}</p>}{action}</div>; }
export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) { const { t } = useTranslation(); return <div className="notice notice-error" role="alert"><AlertCircle size={18} aria-hidden="true" /><span>{t(errorKey(error))}</span>{retry && <Button variant="ghost" onClick={retry}>{t('common.retry')}</Button>}</div>; }
export function Loading() { const { t } = useTranslation(); return <div className="loading" role="status"><LoaderCircle className="spin" size={22} aria-hidden="true" />{t('common.loading')}</div>; }
export function Notice({ children }: { children: ReactNode }) { return <div className="notice" role="status">{children}</div>; }
export function Dialog({ title, children, onClose, className = '', footer }: { title: string; children: ReactNode; onClose: () => void; className?: string; footer?: ReactNode }) {
  const { t } = useTranslation(); const id = useId();
  const reduced = useReducedMotion();
  const dialog = useRef<HTMLDialogElement>(null); const returnFocus = useRef(document.activeElement as HTMLElement | null);
  useLayoutEffect(() => {
    const node = dialog.current; const trigger = returnFocus.current;
    const rootOverflow = document.documentElement.style.overflow, bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden';
    const viewport = window.visualViewport;
    const resize = () => {
      node?.style.setProperty('--dialog-viewport-height', `${viewport?.height ?? window.innerHeight}px`);
      node?.style.setProperty('--dialog-viewport-top', `${viewport?.offsetTop ?? 0}px`);
    };
    resize(); node?.showModal();
    viewport?.addEventListener('resize', resize); viewport?.addEventListener('scroll', resize);
    window.addEventListener('resize', resize);
    return () => {
      viewport?.removeEventListener('resize', resize); viewport?.removeEventListener('scroll', resize);
      window.removeEventListener('resize', resize); node?.close();
      document.documentElement.style.overflow = rootOverflow; document.body.style.overflow = bodyOverflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  return <dialog className={`dialog ${className}`} aria-labelledby={id} ref={dialog} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <m.div className="dialog-content" initial={{ y: reduced ? 0 : 8, scale: reduced ? 1 : .99 }} animate={{ y: 0, scale: 1 }} transition={uiSpring}><div className="dialog-heading"><h2 id={id}>{title}</h2><Button variant="ghost" aria-label={t('common.close')} onClick={onClose}><X size={20} /></Button></div><div className="dialog-body">{children}</div>{footer && <footer className="dialog-footer">{footer}</footer>}</m.div>
  </dialog>;
}
export function ConfirmDialog({ title, description, action, onClose, onConfirm, pending, error }: { title: string; description: string; action: string; onClose: () => void; onConfirm: () => void; pending?: boolean; error?: unknown }) {
  const { t } = useTranslation(); return <Dialog title={title} onClose={() => { if (!pending) onClose(); }}><p>{description}</p>{!!error && <ErrorState error={error} />}<div className="form-actions"><Button variant="secondary" onClick={onClose} disabled={pending} autoFocus>{t('common.cancel')}</Button><Button variant="danger" onClick={onConfirm} disabled={pending}>{pending ? t('common.saving') : action}</Button></div></Dialog>;
}
