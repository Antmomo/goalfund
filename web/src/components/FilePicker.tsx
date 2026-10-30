import { useEffect, useMemo } from "react";
import { useI18n } from "../i18n";

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
  max: number;
  accept: string;
  hint: string;
};

export default function FilePicker({ files, onChange, max, accept, hint }: Props) {
  const { t } = useI18n();
  const previews = useMemo(
    () => files.map((f) => (f.type.startsWith("image/") ? URL.createObjectURL(f) : null)),
    [files],
  );
  useEffect(() => () => previews.forEach((p) => p && URL.revokeObjectURL(p)), [previews]);

  const add = (list: FileList | null) => {
    if (!list) return;
    onChange([...files, ...Array.from(list)].slice(0, max));
  };

  return (
    <div>
      <div className="thumbs">
        {files.map((f, i) => (
          <div key={`${f.name}-${i}`} className="thumb">
            {previews[i] ? <img src={previews[i]!} alt={f.name} /> : <span className="thumb-file">📄 {f.name}</span>}
            <button type="button" aria-label={t.files.remove(f.name)} onClick={() => onChange(files.filter((_, j) => j !== i))}>
              ×
            </button>
          </div>
        ))}
        {files.length < max && (
          <label className="thumb thumb-add">
            <input
              type="file"
              accept={accept}
              multiple
              onChange={(e) => {
                add(e.target.files);
                e.target.value = "";
              }}
            />
            <span>＋</span>
            <small>{t.files.add}</small>
          </label>
        )}
      </div>
      <p className="hint">
        {t.files.count(files.length, max)} · {hint}
      </p>
    </div>
  );
}
