import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { Customer, CustomerInput } from '../../types/domain';
import { customerSchema } from '../../lib/validation';
import { useWorkspace } from '../../app/workspace';
import { api } from '../../services';
import { ApiError } from '../../services/errors';
import { Button, Field, Input, ErrorState } from '../../components/ui/primitives';
export function CustomerForm({ customer, onSaved, onCancel }: { customer?: Customer; onSaved: (customer: Customer) => void; onCancel: () => void }) {
  const { t } = useTranslation(); const { business, industry } = useWorkspace(); const queryClient = useQueryClient(); const [error, setError] = useState<unknown>(null);
  const { register, handleSubmit, setError: setFieldError, formState: { errors } } = useForm<CustomerInput>({ resolver: zodResolver(customerSchema), defaultValues: customer ?? { name: '', email: '', phone: '', notes: '' } });
  const mutation = useMutation({ mutationFn: (input: CustomerInput) => api.customers.save(business.id, input, customer?.id), onSuccess: async c => { await queryClient.invalidateQueries({ queryKey: [business.id] }); onSaved(c); }, onError: e => { setError(e); if (e instanceof ApiError) for (const key of Object.keys(e.fields)) if (['name', 'email', 'phone', 'notes'].includes(key)) setFieldError(key as keyof CustomerInput, { message: 'error.validation' }); } });
  return <form noValidate onSubmit={handleSubmit(values => { setError(null); mutation.mutate({ ...values, notes: industry.features.customerNotes ? values.notes : '' }); })}><div className="form-grid">
    {(['name', 'email', 'phone'] as const).map(key => <Field key={key} id={`customer-${key}`} label={t(`customer.${key}`)} error={errors[key]?.message}><Input id={`customer-${key}`} dir={key === 'name' ? undefined : 'ltr'} type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'} autoComplete={key === 'phone' ? 'tel' : key} {...register(key)} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `customer-${key}-error` : undefined} /></Field>)}
    {industry.features.customerNotes && <Field id="customer-notes" label={t('customer.notes')} error={errors.notes?.message}><textarea id="customer-notes" className="input" rows={4} {...register('notes')} /></Field>}
  </div>{!!error && <ErrorState error={error} />}<div className="form-actions"><Button variant="secondary" onClick={onCancel} disabled={mutation.isPending}>{t('common.cancel')}</Button><Button type="submit" disabled={mutation.isPending}>{t(mutation.isPending ? 'common.saving' : 'common.save')}</Button></div></form>;
}

