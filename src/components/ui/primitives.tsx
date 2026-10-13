import { Children, cloneElement, isValidElement, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CalendarCheck2, X, LoaderCircle } from 'lucide-react';
import { errorKey } from '../../services/errors';
import type { AppointmentStatus } from '../../types/domain';

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button type="button" className={`button button-${variant} ${className}`} {...props}>{children}</button>;
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
export function PageHeading({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) { return <div className="page-heading"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</div>; }
export function StatusBadge({ status }: { status: AppointmentStatus }) { const { t } = useTranslation(); return <span className={`status status-${status}`}><span className="status-dot" />{t(`status.${status}`)}</span>; }
export function EmptyState({ title, description, action }: { title?: string; description?: string; action?: ReactNode }) { const { t } = useTranslation(); return <div className="empty-state"><CalendarCheck2 size={28} aria-hidden="true" /><h3>{title || t('common.empty')}</h3>{description && <p>{description}</p>}{action}</div>; }
export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) { const { t } = useTranslation(); return <div className="notice notice-error" role="alert"><AlertCircle size={18} aria-hidden="true" /><span>{t(errorKey(error))}</span>{retry && <Button variant="ghost" onClick={retry}>{t('common.retry')}</Button>}</div>; }
export function Loading() { const { t } = useTranslation(); return <div className="loading" role="status"><LoaderCircle className="spin" size={22} aria-hidden="true" />{t('common.loading')}</div>; }
export function Notice({ children }: { children: ReactNode }) { return <div className="notice" role="status">{children}</div>; }
export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const { t } = useTranslation(); const id = useId();
  return <dialog open className="dialog" aria-labelledby={id} ref={node => { if (node && !node.hasAttribute('data-modal')) { node.close(); node.showModal(); node.setAttribute('data-modal', 'true'); } }} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="dialog-content"><div className="dialog-heading"><h2 id={id}>{title}</h2><Button variant="ghost" aria-label={t('common.close')} onClick={onClose}><X size={20} /></Button></div>{children}</div>
  </dialog>;
}
export function ConfirmDialog({ title, description, action, onClose, onConfirm, pending, error }: { title: string; description: string; action: string; onClose: () => void; onConfirm: () => void; pending?: boolean; error?: unknown }) {
  const { t } = useTranslation(); return <Dialog title={title} onClose={() => { if (!pending) onClose(); }}><p>{description}</p>{!!error && <ErrorState error={error} />}<div className="form-actions"><Button variant="secondary" onClick={onClose} disabled={pending} autoFocus>{t('common.cancel')}</Button><Button variant="danger" onClick={onConfirm} disabled={pending}>{pending ? t('common.saving') : action}</Button></div></Dialog>;
}

