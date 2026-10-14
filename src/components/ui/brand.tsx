import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function BrandMark({ size = 90 }: { size?: number }) {
  return (
    <img
      className="acm-mark"
      src="/brand/acm-mark.webp"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
    />
  );
}
export function BrandLogo({
  className = "",
  description = false,
}: {
  className?: string;
  description?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Link
      className={`brand acm-brand ${className}`}
      to="/"
      aria-label={t("landing.home")}
    >
      <BrandMark />
      <span>
        <strong>{t("app.name")}</strong>
        {description && (
          <small className="brand-description">{t("brand.fullName")}</small>
        )}
      </span>
    </Link>
  );
}
