import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Save, Trash2, Building2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '../../app/workspace';
import { brandingApi } from '../../services/platform';
import { ApiError } from '../../services/errors';
import { Button, ErrorState, Notice } from '../../components/ui/primitives';

export function BusinessLogoSettings() {
  const { t } = useTranslation(), workspace = useWorkspace();
  const [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState(''), [error, setError] = useState<unknown>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!file) { setPreview(''); return; } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  const mutation = useMutation({ mutationFn: (remove: boolean) => remove ? brandingApi.remove(workspace.business.id) : brandingApi.upload(workspace.business.id, file!), onSuccess: business => { workspace.updateBusiness(business); setFile(null); if (input.current) input.current.value = ''; } });
  return <div className="branding-settings">
    <div className="branding-preview">{preview || workspace.business.logoUrl ? <img src={preview || workspace.business.logoUrl!} alt={t('branding.logoAlt', { name: workspace.business.name })} /> : <Building2 size={32} aria-hidden="true" />}</div>
    <div className="branding-details"><h3>{t('branding.title')}</h3><p>{t('branding.hint')}</p>
      {workspace.can('business.write') && <><div className="branding-actions"><label className="button button-secondary file-button"><ImagePlus size={17} aria-hidden="true" />{t('branding.choose')}<input ref={input} type="file" accept="image/png,image/jpeg,image/webp" disabled={mutation.isPending} onChange={event => { const selected = event.target.files?.[0]; setError(null); mutation.reset(); if (!selected) return; if (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type) || selected.size > 2 * 1024 * 1024) { setError(new ApiError('branding.invalidImage')); event.target.value = ''; return; } setFile(selected); }} /></label>
      {file && <Button disabled={mutation.isPending} onClick={() => mutation.mutate(false)}><Save size={16} aria-hidden="true" />{t(mutation.isPending ? 'common.saving' : 'branding.save')}</Button>}
      {workspace.business.logoUrl && <Button variant="ghost" disabled={mutation.isPending} onClick={() => { setError(null); mutation.mutate(true); }}><Trash2 size={16} aria-hidden="true" />{t('branding.remove')}</Button>}</div>{file && <small>{file.name}</small>}</>}
      {(error || mutation.error) && <ErrorState error={error || mutation.error} />}{mutation.isSuccess && <Notice>{t('common.saved')}</Notice>}
    </div>
  </div>;
}
