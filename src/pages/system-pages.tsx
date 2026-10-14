import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { WifiOff, FileQuestion } from "lucide-react";
import { LanguageDropdown } from "../components/ui/language-dropdown";
export function SystemPage({ offline = false }: { offline?: boolean }) {
  const { t } = useTranslation();
  const prefix = offline ? "offline" : "notFound";
  useEffect(() => {
    document.title = `${t(`${prefix}.title`)} · ${t("app.name")}`;
  }, [prefix, t]);
  return (
    <main className="system-page">
      <LanguageDropdown />
      {offline ? <WifiOff size={42} /> : <FileQuestion size={42} />}
      <h1>{t(`${prefix}.title`)}</h1>
      <p>{t(`${prefix}.description`)}</p>
      <Link to="/app/overview" className="button button-primary">
        {t("offline.return")}
      </Link>
    </main>
  );
}
