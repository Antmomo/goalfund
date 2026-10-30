import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container narrow center">
        <h1 className="page-title">Pagina non trovata</h1>
        <p>La pagina che cerchi non esiste.</p>
        <Link to="/" className="btn btn-primary">
          Torna alla home
        </Link>
      </div>
    </section>
  );
}
