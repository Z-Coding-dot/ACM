import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Button, Dialog, Notice } from '../ui/primitives';
interface InstallEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
export function PwaControls() {
  const { t } = useTranslation(); const [install, setInstall] = useState<InstallEvent | null>(null), [ios, setIos] = useState(false);
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW();
  useEffect(() => { const handler = (e: Event) => { e.preventDefault(); setInstall(e as InstallEvent); }; const installed = () => setInstall(null); window.addEventListener('beforeinstallprompt', handler); window.addEventListener('appinstalled', installed); return () => { window.removeEventListener('beforeinstallprompt', handler); window.removeEventListener('appinstalled', installed); }; }, []);
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches;
  return <div className="pwa-controls">{needRefresh && <Notice><span>{t('pwa.update')}</span><Button variant="secondary" onClick={() => void updateServiceWorker(true)}>{t('pwa.reload')}</Button><Button variant="ghost" onClick={() => setNeedRefresh(false)}>{t('pwa.dismiss')}</Button></Notice>}{(install || isIos) && <Button variant="ghost" onClick={() => { if (install) void install.prompt().then(() => install.userChoice).then(choice => { if (choice.outcome === 'accepted') setInstall(null); }); else setIos(true); }}><Download size={16} />{t('pwa.install')}</Button>}{ios && <Dialog title={t('pwa.title')} onClose={() => setIos(false)}><p>{t('pwa.ios')}</p></Dialog>}</div>;
}
