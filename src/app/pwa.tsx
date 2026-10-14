import { createContext, useContext, useEffect, useState, useRef, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
export interface InstallEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
interface PwaState {
  install: InstallEvent | null; setInstall: Dispatch<SetStateAction<InstallEvent | null>>;
  needRefresh: boolean; setNeedRefresh: Dispatch<SetStateAction<boolean>>; updateServiceWorker: (reload?: boolean) => Promise<void>;
}
const PwaContext = createContext<PwaState | null>(null);
export function PwaProvider({ children }: { children: ReactNode }) {
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const accepted = useRef(false), reloading = useRef(false);
  const reload = () => { if (accepted.current && !reloading.current) { reloading.current = true; window.location.reload(); } };
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker: activate } = useRegisterSW({ onNeedReload: reload });
  async function updateServiceWorker() {
    accepted.current = true;
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration?.waiting) return reload();
    // Workbox marks first-session/external updates differently; the confirmed
    // controller change is authoritative for both cases.
    navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true });
    await activate(true);
  }
  useEffect(() => {
    const capture = (event: Event) => { event.preventDefault(); setInstall(event as InstallEvent); };
    const installed = () => setInstall(null);
    window.addEventListener('beforeinstallprompt', capture); window.addEventListener('appinstalled', installed);
    return () => { window.removeEventListener('beforeinstallprompt', capture); window.removeEventListener('appinstalled', installed); };
  }, []);
  return <PwaContext.Provider value={{ install, setInstall, needRefresh, setNeedRefresh, updateServiceWorker }}>{children}</PwaContext.Provider>;
}
export const usePwa = () => useContext(PwaContext);
