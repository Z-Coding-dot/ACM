import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import { PageHeading } from '../../components/ui/primitives';
import { AccountSettings } from '../settings/account-settings';

export function PlatformAccountPage() {
  const { t } = useTranslation();
  return <><PageHeading title={t('account.settings')} description={t('settings.accountHint')} /><section className="panel settings-card platform-account-card"><header className="settings-card-heading"><span className="settings-section-icon"><ShieldCheck size={21} aria-hidden="true" /></span><div><h2>{t('settings.security')}</h2><p>{t('platform.accountHint')}</p></div></header><AccountSettings /></section></>;
}
