import { Link } from "react-router-dom";
import { useI18n } from "../i18n";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <section className="section">
      <div className="container narrow center">
        <h1 className="page-title">{t.notFound.title}</h1>
        <p>{t.notFound.text}</p>
        <Link to="/" className="btn btn-primary">
          {t.notFound.home}
        </Link>
      </div>
    </section>
  );
}
