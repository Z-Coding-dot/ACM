import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PublicLayout, PublicAction } from './public-layout';
import { CalendarCheck2, KeyRound, Database, Wifi } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Reveal } from '../../components/ui/motion';
import { uiSpring } from '../../lib/motion';

export function ProductInfoPage() {
  const { t } = useTranslation(); const reduced = useReducedMotion();
  const cards = [{ id: 'product', icon: CalendarCheck2 }, { id: 'preview', icon: KeyRound }, { id: 'data', icon: Database }, { id: 'offline', icon: Wifi }];
  return <PublicLayout><div className="public-container public-information"><Reveal><Link className="back-link" to="/">{t('landing.backHome')}</Link><p className="landing-eyebrow">{t('landing.productInfo')}</p><h1>{t('public.title')}</h1><p className="public-information-lead">{t('public.description')}</p></Reveal>
    <div className="public-information-grid">{cards.map((card, index) => <motion.section key={card.id} id={card.id === 'data' ? 'data' : undefined} tabIndex={-1} aria-labelledby={`public-${card.id}-title`} initial={{ y: reduced ? 0 : 14 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ ...uiSpring, delay: reduced ? 0 : index * .05 }}><span className="information-card-icon"><card.icon size={25} aria-hidden="true" /></span><h2 id={`public-${card.id}-title`}>{t(`public.${card.id}Title`)}</h2><p>{t(`public.${card.id}Description`)}</p></motion.section>)}</div>
    <Reveal className="landing-actions"><PublicAction /><Link className="button button-secondary" to="/login">{t('auth.signin')}</Link></Reveal>
  </div></PublicLayout>;
}
