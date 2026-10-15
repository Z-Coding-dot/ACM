import { useTranslation } from 'react-i18next';
import { Button } from './primitives';
export function Pagination({ page, lastPage, onPage }: { page: number; lastPage: number; onPage: (value: number) => void }) {
  const { t } = useTranslation();
  return <div className="pagination"><span>{t('common.page', { page, total: lastPage })}</span><div><Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>{t('common.previous')}</Button><Button variant="secondary" disabled={page >= lastPage} onClick={() => onPage(page + 1)}>{t('common.next')}</Button></div></div>;
}
