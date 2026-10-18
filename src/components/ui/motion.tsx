import { m, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { Link } from 'react-router-dom';
import { uiSpring } from '../../lib/motion';

export const MotionLink = m.create(Link);
export function Reveal({ children, delay = 0, ...props }: HTMLMotionProps<'div'> & { delay?: number }) {
  const reduced = useReducedMotion();
  return <m.div {...props} data-motion="reveal" initial={{ y: reduced ? 0 : 14 }} whileInView={{ y: 0 }} viewport={{ once: true, amount: .08 }} transition={{ ...uiSpring, delay: reduced ? 0 : delay }}>{children}</m.div>;
}
