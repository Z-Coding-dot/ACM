import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, Search, ArrowUpRight } from 'lucide-react';
import { api } from '../../services';
import { useWorkspace } from '../../app/workspace';
import { PageHeading, Input, Button, Loading, ErrorState, EmptyState } from '../../components/ui/primitives';
import { formatDate } from '../../lib/dates';
export function CustomersPage() {
  const { t } = useTranslation(); const { business, industry, locale, can } = useWorkspace(); const [search, setSearch] = useState(''), [page, setPage] = useState(1);
  const query = useQuery({ queryKey: [business.id, 'customer-search', search, page], queryFn: () => api.customers.search(business.id, search, page) });
  return <><PageHeading title={t(industry.customerLabel)} description={t('customer.subtitle')} actions={can('customers.write') && <Link className="button button-primary" to="/app/customers/new"><Plus size={17} />{t('customer.new')}</Link>} /><section className="panel"><div className="table-toolbar"><div className="search-field"><Search size={18} aria-hidden="true" /><Input aria-label={t('customer.search')} placeholder={t('customer.search')} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>{query.data && <span className="muted">{t('common.records', { count: query.data.meta.total })}</span>}</div>
  {query.isPending ? <Loading /> : query.error ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : !query.data.data.length ? <EmptyState title={t(search ? 'common.noResults' : 'common.empty')} description={t(search ? 'common.adjustFilters' : industry.empty)} /> : <table className="data-table"><thead><tr><th>{t('customer.name')}</th><th>{t('customer.email')}</th><th>{t('customer.phone')}</th><th>{t('overview.recent')}</th><th><span className="sr-only">{t('common.details')}</span></th></tr></thead><tbody>{query.data.data.map(c => <tr key={c.id}><td data-label={t('customer.name')}><Link className="record-link contact-name" to={`/app/customers/${c.id}`}><span className="avatar" aria-hidden="true">{c.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>{c.name}</Link></td><td data-label={t('customer.email')}><bdi>{c.email}</bdi></td><td data-label={t('customer.phone')}><bdi>{c.phone}</bdi></td><td data-label={t('overview.recent')}>{formatDate(c.createdAt, locale, business.timeZone)}</td><td><Link className="icon-link" aria-label={`${t('common.details')}: ${c.name}`} to={`/app/customers/${c.id}`}><ArrowUpRight size={18} className="directional" /></Link></td></tr>)}</tbody></table>}
  {query.data && <div className="pagination"><span>{t('common.page', { page, total: query.data.meta.lastPage })}</span><div><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('common.previous')}</Button><Button variant="secondary" disabled={page >= query.data.meta.lastPage} onClick={() => setPage(page + 1)}>{t('common.next')}</Button></div></div>}</section></>;
}
