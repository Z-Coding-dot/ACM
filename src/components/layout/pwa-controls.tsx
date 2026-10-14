import { useState } from 'react';
import { usePwa } from '../../app/pwa';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Button, Dialog, Notice } from '../ui/primitives';
export function PwaControls() {
  const { t } = useTranslation(); const [ios, setIos] = useState(false); const [failed, setFailed] = useState(false); const state = usePwa();
  if (!state) return null;
  const { install, setInstall, needRefresh, setNeedRefresh, updateServiceWorker } = state;
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches;
  return <footer className="pwa-controls">{failed && <Notice>{t('pwa.installUnavailable')}</Notice>}{needRefresh && <Notice><span>{t('pwa.update')}</span><Button variant="secondary" onClick={() => void updateServiceWorker(true)}>{t('pwa.reload')}</Button><Button variant="ghost" onClick={() => setNeedRefresh(false)}>{t('pwa.dismiss')}</Button></Notice>}{(install || isIos) && <Button variant="ghost" onClick={() => { if (install) void install.prompt().then(() => install.userChoice).catch(() => setFailed(true)).finally(() => setInstall(null)); else setIos(true); }}><Download size={16} />{t('pwa.install')}</Button>}{ios && <Dialog title={t('pwa.title')} onClose={() => setIos(false)}><p>{t('pwa.ios')}</p></Dialog>}</footer>;
}
