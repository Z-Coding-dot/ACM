import { usePublicText } from './public-text';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarCheck2, Users, SlidersHorizontal, UserRoundCog, Scissors, Stethoscope, GraduationCap, BriefcaseBusiness, ArrowRight } from 'lucide-react';
import { useAuth } from '../../app/workspace';
import { PublicLayout, PublicAction } from './public-layout';
import { ProductPreview } from './product-preview';
import { m, useReducedMotion } from 'framer-motion';
import { Reveal } from '../../components/ui/motion';
import { uiSpring } from '../../lib/motion';
import { industries } from '../../config/industries';

const features = [
  { id: 'scheduling', icon: CalendarCheck2 }, { id: 'customers', icon: Users },
  { id: 'team', icon: UserRoundCog }, { id: 'configuration', icon: SlidersHorizontal },
];
const businesses = [
  { id: 'salon', icon: Scissors }, { id: 'clinic', icon: Stethoscope },
  { id: 'education', icon: GraduationCap }, { id: 'consulting', icon: BriefcaseBusiness },
 ] as const;
export function LandingPage() {
  const { i18n } = useTranslation(); const t = usePublicText(); const { session } = useAuth(); const reduced = useReducedMotion();
  return <PublicLayout>
    <section className="public-container landing-hero" aria-labelledby="landing-title"><Reveal className="landing-hero-copy"><p className="landing-eyebrow">{t('landing.eyebrow')}</p><h1 id="landing-title">{t('landing.heroTitle')}<m.span initial={{ y: reduced ? 0 : 10 }} animate={{ y: 0 }} transition={{ ...uiSpring, delay: reduced ? 0 : .08 }}>{t('landing.heroAccent')}</m.span></h1><p className="landing-hero-description">{t('landing.heroDescription')}</p><div className="landing-actions"><PublicAction /><Link className="button button-secondary" to={session ? '/#features' : '/login'}>{t(session ? 'landing.exploreFeatures' : 'auth.signin')}</Link></div><p className="landing-hero-note">{t('landing.heroNote')}</p></Reveal><Reveal delay={.1}><ProductPreview /></Reveal></section>
    <section id="features" tabIndex={-1} className="landing-section landing-features" aria-labelledby="features-title"><div className="public-container landing-feature-layout"><Reveal className="landing-section-heading"><p className="landing-eyebrow">{t('landing.features')}</p><h2 id="features-title">{t('landing.featuresTitle')}</h2><p>{t('landing.featuresDescription')}</p></Reveal><div className="landing-feature-grid">{features.map((feature, index) => <m.article key={feature.id} initial={{ y: reduced ? 0 : 16 }} whileInView={{ y: 0 }} viewport={{ once: true, amount: .1 }} whileHover={reduced ? undefined : { y: -4 }} transition={{ ...uiSpring, delay: reduced ? 0 : index * .04 }}><div className="feature-card-top"><span className="feature-card-icon"><feature.icon size={24} aria-hidden="true" /></span><span className="feature-card-number" aria-hidden="true">{new Intl.NumberFormat(i18n.language, { minimumIntegerDigits: 2 }).format(index + 1)}</span></div><h3>{t(`landing.feature.${feature.id}.title`)}</h3><p>{t(`landing.feature.${feature.id}.description`)}</p><div className="feature-card-detail">{t(`landing.feature.${feature.id}.detail`)}</div></m.article>)}</div></div></section>
    <section id="businesses" tabIndex={-1} className="landing-section landing-businesses" aria-labelledby="businesses-title"><div className="public-container"><Reveal className="landing-business-intro"><div className="landing-section-heading"><p className="landing-eyebrow">{t('landing.forBusinesses')}</p><h2 id="businesses-title">{t('landing.businessesTitle')}</h2></div><p>{t('landing.businessesDescription')}</p></Reveal><div className="landing-business-grid">{businesses.map((business, index) => <m.article key={business.id} initial={{ y: reduced ? 0 : 16 }} whileInView={{ y: 0 }} viewport={{ once: true }} whileHover={reduced ? undefined : { y: -4 }} transition={{ ...uiSpring, delay: reduced ? 0 : index * .04 }}><span className="business-card-icon"><business.icon size={26} aria-hidden="true" /></span><div><h3>{t(`industry.${business.id}`)}</h3><p>{t(`landing.business.${business.id}`)}</p><div className="business-card-terms"><span>{t(industries[business.id].customerLabel)}</span><span>{t(industries[business.id].staffLabel)}</span></div></div></m.article>)}</div></div></section>
    <section id="how-it-works" tabIndex={-1} className="landing-section" aria-labelledby="how-title"><div className="public-container"><Reveal className="landing-section-heading"><p className="landing-eyebrow">{t('landing.howEyebrow')}</p><h2 id="how-title">{t('landing.howTitle')}</h2></Reveal><ol className="landing-steps">{['setup', 'configure', 'manage'].map((step, index) => <m.li key={step} initial={{ y: reduced ? 0 : 16 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ ...uiSpring, delay: reduced ? 0 : index * .08 }}><span className="landing-step-number" aria-hidden="true">{new Intl.NumberFormat(i18n.language, { minimumIntegerDigits: 2 }).format(index + 1)}</span><h3>{t(`landing.step.${step}.title`)}</h3><p>{t(`landing.step.${step}.description`)}</p><span className="step-card-line" aria-hidden="true" /></m.li>)}</ol></div></section>
    <section className="public-container landing-final" aria-labelledby="final-title"><div><p className="landing-eyebrow">{t('landing.finalEyebrow')}</p><h2 id="final-title">{t('landing.finalTitle')}</h2><p>{t('landing.finalDescription')}</p></div><div className="landing-actions"><PublicAction className="button button-secondary" />{!session && <Link className="landing-final-sign-in" to="/login">{t('auth.signin')}<ArrowRight size={17} className="directional" aria-hidden="true" /></Link>}</div></section>
  </PublicLayout>;
}
