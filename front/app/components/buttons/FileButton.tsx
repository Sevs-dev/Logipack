"use client";
import React, {
  ChangeEvent,
  DragEvent,
  useRef,
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { FaFileAlt, FaTimesCircle, FaFilePdf } from "react-icons/fa";

interface UploadedFile {
  file: File;
  preview?: string;
  progress: number;
  uploading: boolean;
  error?: string;
}

export interface AdvancedFileUploaderHandle {
  clear: () => void;
}

interface AdvancedFileUploaderProps {
  maxSizeMB?: number;
  onChange: (files: File[]) => void;
  allowMultiple?: boolean;
  /** Solo para depurar o submit nativo; con FormData manual no es necesario. */
  fieldName?: string;
  /** Restringe tipos. Por defecto: solo PDF */
  accept?: string;
  /** Máximo de archivos válidos (opcional) */
  maxFiles?: number;
  /** Evita duplicados por nombre+tamaño (true por defecto) */
  dedupe?: boolean;
}

const isPdf = (f: File) =>
  f.type === "application/pdf" || /\.pdf$/i.test(f.name);

const AdvancedFileUploader = forwardRef<
  AdvancedFileUploaderHandle,
  AdvancedFileUploaderProps
>(
  (
    {
      maxSizeMB = 5,
      onChange,
      allowMultiple = true,
      fieldName = "attachment",
      accept = "application/pdf,.pdf",
      maxFiles,
      dedupe = true,
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [dragOver, setDragOver] = useState(false);

    useImperativeHandle(ref, () => ({
      clear: () => clearAllFiles(),
    }));

    const getIcon = (name: string) => {
      const ext = name.split(".").pop()?.toLowerCase();
      switch (ext) {
        case "pdf":
          return <FaFilePdf className="text-red-500" size={16} />;
        default:
          return <FaFileAlt className="text-gray-400" size={16} />;
      }
    };

    const clearAllFiles = () => {
      setFiles((prev) => {
        prev.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
        return [];
      });
      onChange([]);
      if (inputRef.current) inputRef.current.value = "";
    };

    const pushFiles = (picked: File[]) => {
      // Dedupe por nombre+tamaño respecto a lo ya cargado
      let candidate = picked;
      if (dedupe) {
        const seen = new Set(
          files.map((f) => `${f.file.name}::${f.file.size}`)
        );
        candidate = picked.filter((f) => !seen.has(`${f.name}::${f.size}`));
      }

      // Separar válidos (PDF) de inválidos (no-PDF)
      const invalidType = candidate.filter((f) => !isPdf(f));
      const candidatePdf = candidate.filter(isPdf);

      // Enforce maxFiles contando SOLO válidos actuales
      const currentValidCount = files.filter((f) => !f.error).length;
      const remaining =
        typeof maxFiles === "number"
          ? Math.max(0, maxFiles - currentValidCount)
          : Number.MAX_SAFE_INTEGER;

      const toAddValid = candidatePdf.slice(0, remaining);

      const errorItems: UploadedFile[] = [
        ...invalidType.map((file) => ({
          file,
          error: "Solo se permiten archivos PDF.",
          progress: 0,
          uploading: false,
        })),
        ...toAddValid
          .filter((file) => file.size > maxSizeMB * 1024 * 1024)
          .map((file) => ({
            file,
            error: `Excede los ${maxSizeMB}MB`,
            progress: 0,
            uploading: false,
          })),
      ];

      // Filtrar los válidos que SÍ pasan tamaño
      const validSized = toAddValid.filter(
        (file) => file.size <= maxSizeMB * 1024 * 1024
      );

      const okItems: UploadedFile[] = validSized.map((file) => ({
        file,
        preview: undefined, // No preview para PDF
        progress: 0,
        uploading: true,
      }));

      setFiles((prev) =>
        allowMultiple
          ? [...prev, ...errorItems, ...okItems]
          : [...errorItems, ...okItems]
      );
    };

    const handleFiles = (selected: FileList | null) => {
      if (!selected || selected.length === 0) return;
      const picked = allowMultiple ? Array.from(selected) : [selected[0]];
      pushFiles(picked);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Permite re-seleccionar el mismo archivo
      e.currentTarget.value = "";
    };

    const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
      if (inputRef.current) inputRef.current.value = "";
    };

    const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setDragOver(true);
    };

    const removeFile = (index: number) => {
      setFiles((prev) => {
        const updated = [...prev];
        const [removed] = updated.splice(index, 1);
        if (removed?.preview) URL.revokeObjectURL(removed.preview);
        return updated;
      });
    };

    // Simulación de progreso simple (UI)
    useEffect(() => {
      const hasUploading = files.some((f) => f.uploading && !f.error);
      if (!hasUploading) return;

      const id = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) => {
            if (!f.uploading || f.error) return f;
            const increment = Math.random() * 15;
            const next = Math.min(f.progress + increment, 100);
            return { ...f, progress: next, uploading: next < 100 };
          })
        );
      }, 200);

      return () => clearInterval(id);
    }, [files]);

    // ==== 🔑 Notificación al padre SIN bucles ====
    const onChangeRef = useRef(onChange);
    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    const filesPayload = useMemo(
      () => files.filter((f) => !f.error).map((f) => f.file),
      [files]
    );

    const lastPayloadRef = useRef<File[] | null>(null);
    useEffect(() => {
      const prev = lastPayloadRef.current;
      const same =
        prev &&
        prev.length === filesPayload.length &&
        filesPayload.every((f, i) => f === prev[i]);

      if (same) return;
      lastPayloadRef.current = filesPayload;
      onChangeRef.current(filesPayload);
    }, [filesPayload]);

    // Cleanup previews on unmount
    useEffect(() => {
      return () => {
        files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Conteo de válidos para mostrar contra maxFiles
    const validCount = files.filter((f) => !f.error).length;

    return (
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-2 p-1.5 dark:[--surface:30_41_59] dark:[--surface-muted:51_65_85] dark:[--border:71_85_105] dark:[--foreground:241_245_249] dark:[--ring:56_189_248] dark:[--accent:56_189_248]">
        {/* Dropzone */}
        {files.length === 0 && (
          <label
            htmlFor="file-uploader"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setDragOver(false)}
            className={[
              "flex flex-col items-center justify-center w-full flex-1 min-h-[80px] px-3 py-2",
              "border-2 rounded-md cursor-pointer transition-all duration-200 text-center shadow-sm text-xs",
              "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
              dragOver
                ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10"
                : "border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--surface-muted))]",
              "dark:bg-slate-900 dark:border-slate-700",
            ].join(" ")}
          >
            <FaFilePdf
              className="mb-1 text-red-500 dark:text-red-400"
              size={20}
            />
            <p className="text-[11px] text-[rgb(var(--foreground))] mb-0.5">
              Subir archivo (solo PDF)
            </p>
            <input
              ref={inputRef}
              id="file-uploader"
              name={fieldName}
              type="file"
              accept={accept}
              multiple={allowMultiple}
              onChange={handleInputChange}
              className="hidden"
            />
          </label>
        )}

        {/* Acciones cuando hay archivos */}
        {files.length > 0 && (
          <div className="flex items-center justify-between">
            {typeof maxFiles === "number" && (
              <span className="text-[10px] text-[rgb(var(--foreground))]/60">
                {validCount}/{maxFiles}
              </span>
            )}
            <button
              onClick={clearAllFiles}
              type="button"
              className="ml-auto text-red-600 dark:text-red-400 hover:underline text-[11px]"
              title="Eliminar todos los archivos"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {/* Lista de archivos */}
        <div className="flex flex-col gap-1 w-full">
          <div className="overflow-y-auto max-h-[160px] grid gap-1 pr-0.5">
            {files.length === 0 ? (
              <div className="text-center text-[rgb(var(--foreground))]/40 text-[10px] mt-2">
                Sin archivos
              </div>
            ) : (
              files.map((f, index) => (
                <div
                  key={`${f.file.name}-${f.file.size}-${index}`}
                  className={[
                    "relative flex items-start gap-2 p-1.5 text-[10px] rounded border shadow-sm",
                    "bg-[rgb(var(--surface))] border-[rgb(var(--border))]",
                    "dark:bg-slate-900 dark:border-slate-700",
                  ].join(" ")}
                >
                  <button
                    onClick={() => removeFile(index)}
                    type="button"
                    className="absolute top-1 right-1 text-red-500 dark:text-red-400 hover:underline text-[10px] flex items-center gap-0.5"
                    title="Eliminar"
                  >
                    <FaTimesCircle size={10} /> Limpiar
                  </button>

                  {getIcon(f.file.name)}

                  <div className="flex-1 min-w-0">
                    <p
                      className="truncate font-medium text-[rgb(var(--foreground))]"
                      title={f.file.name}
                    >
                      {f.file.name}
                    </p>
                    <p className="text-[rgb(var(--foreground))]/60">
                      {(f.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>

                    {f.error && (
                      <p className="text-red-600 dark:text-red-400 font-medium">
                        {f.error}
                      </p>
                    )}

                    {!f.error && f.progress < 100 && (
                      <div className="w-full bg-[rgb(var(--surface-muted))] dark:bg-slate-800/70 rounded-full mt-0.5 h-1">
                        <div
                          className="bg-[rgb(var(--accent))] h-full transition-all duration-300"
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                    )}

                    {!f.error && f.progress >= 100 && (
                      <p className="text-green-600 dark:text-green-400">
                        ✓ Subido
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }
);

AdvancedFileUploader.displayName = "AdvancedFileUploader";
export default AdvancedFileUploader;
