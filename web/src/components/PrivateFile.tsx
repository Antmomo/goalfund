import { useEffect, useState } from "react";
import { adminApi } from "../lib/adminApi";

type Props = { token: string; tipo: "documento" | "foto"; fileKey: string; label: string };

/** Anteprima di un file privato, caricata con il token admin. */
export default function PrivateFile({ token, tipo, fileKey, label }: Props) {
  const [file, setFile] = useState<{ url: string; type: string } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let url: string | undefined;
    let cancelled = false;
    adminApi
      .file(token, tipo, fileKey)
      .then((f) => {
        url = f.url;
        if (cancelled) URL.revokeObjectURL(f.url);
        else setFile(f);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [token, tipo, fileKey]);

  if (failed) return <div className="doc-thumb doc-missing">Non disponibile</div>;
  if (!file) return <div className="doc-thumb doc-loading">…</div>;

  return (
    <a className="doc-thumb" href={file.url} target="_blank" rel="noreferrer" title={`Apri ${label}`}>
      {file.type.startsWith("image/") ? <img src={file.url} alt={label} /> : <span>📄 PDF</span>}
    </a>
  );
}
