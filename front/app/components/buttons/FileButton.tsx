'use client';
import React, {
  ChangeEvent,
  DragEvent,
  useRef,
  useState,
  useEffect,
} from 'react';
import { FaFileAlt, FaTimesCircle, FaFileImage, FaFilePdf, FaFileWord, FaFileExcel, FaFileArchive } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface UploadedFile {
  file: File;
  preview?: string;
  progress: number;
  uploading: boolean;
  error?: string;
}

interface AdvancedFileUploaderProps {
  maxSizeMB?: number;
  onChange: (files: File[]) => void;
  allowMultiple?: boolean;
}

const AdvancedFileUploader: React.FC<AdvancedFileUploaderProps> = ({
  maxSizeMB = 5,
  onChange,
  allowMultiple = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;

    const newFiles: UploadedFile[] = [];
    Array.from(selected).forEach((file) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        newFiles.push({
          file,
          error: `Excede los ${maxSizeMB}MB`,
          progress: 0,
          uploading: false,
        });
      } else {
        newFiles.push({
          file,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
          progress: 0,
          uploading: true,
        });
      }
    });

    const merged = allowMultiple ? [...files, ...newFiles] : newFiles;
    setFiles(merged);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const removeFile = (index: number) => {
    const updated = [...files];
    updated.splice(index, 1);
    setFiles(updated);
  };

  const clearAllFiles = () => {
    setFiles([]);
    onChange([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  useEffect(() => {
    files.forEach((fileObj, index) => {
      if (!fileObj.uploading || fileObj.progress >= 100) return;

      const interval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? {
                ...f,
                progress: Math.min(f.progress + Math.random() * 15, 100),
                uploading: f.progress + 15 >= 100 ? false : true,
              }
              : f
          )
        );
      }, 200);

      return () => clearInterval(interval);
    });

    onChange(files.map((f) => f.file));
  }, [files]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-2 p-1.5">
      {/* Dropzone */}
      <label
        htmlFor="file-uploader"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        className={`flex flex-col items-center justify-center w-full md:w-auto flex-1 min-h-[80px] px-3 py-2 border-2 rounded-md cursor-pointer transition-all duration-200 text-center shadow-sm text-xs ${dragOver
          ? 'border-blue-600 bg-blue-50'
          : 'border-dashed border-gray-300 bg-white hover:bg-gray-50'
          }`}
      >
        <FaFileAlt className="text-blue-500 mb-1" size={20} />
        <p className="text-[11px] text-gray-700 mb-0.5">Subir archivo</p>
        <input
          ref={inputRef}
          id="file-uploader"
          type="file"
          multiple={allowMultiple}
          onChange={handleInputChange}
          className="hidden"
        />
      </label>

      {/* Archivos */}
      <div className="flex flex-col flex-[1.5] gap-1 w-full">
        <div className="overflow-y-auto max-h-[160px] grid gap-1 pr-0.5">
          {files.length === 0 ? (
            <div className="text-center text-gray-400 text-[10px] mt-2">Sin archivos</div>
          ) : (
            files.map((f, index) => {
              const ext = f.file.name.split('.').pop()?.toLowerCase();
              let icon;
              switch (ext) {
                case 'pdf':
                  icon = <FaFilePdf className="text-red-500" size={16} />;
                  break;
                case 'doc':
                case 'docx':
                  icon = <FaFileWord className="text-blue-600" size={16} />;
                  break;
                case 'xls':
                case 'xlsx':
                  icon = <FaFileExcel className="text-green-600" size={16} />;
                  break;
                case 'jpg':
                case 'jpeg':
                case 'png':
                case 'gif':
                  icon = <FaFileImage className="text-purple-500" size={16} />;
                  break;
                case 'zip':
                case 'rar':
                  icon = <FaFileArchive className="text-yellow-600" size={16} />;
                  break;
                default:
                  icon = <FaFileAlt className="text-gray-400" size={16} />;
              }

              return (
                <div
                  key={index}
                  className="relative flex items-start gap-2 p-1.5 border rounded bg-white shadow-sm text-[10px]"
                >
                  {/* Botón arriba a la derecha */}
                  <button
                    onClick={() => removeFile(index)}
                    type="button"
                    className="absolute top-1 right-1 text-red-500 hover:text-red-700 text-[10px] flex items-center gap-0.5"
                    title="Eliminar"
                  >
                    <FaTimesCircle size={10} /> Limpiar
                  </button>

                  {icon}

                  <div className="flex-1 min-w-0">
                    <p className="truncate" title={f.file.name}>{f.file.name}</p>
                    <p className="text-black font-bold">{files[0].file.name}</p>
                    <p className="text-gray-500">{(f.file.size / 1024 / 1024).toFixed(2)} MB</p>

                    {f.error && <p className="text-red-500">{f.error}</p>}

                    {!f.error && f.progress < 100 && (
                      <div className="w-full bg-gray-200 rounded-full mt-0.5 h-1">
                        <div
                          className="bg-blue-500 h-full transition-all duration-300"
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                    )}

                    {!f.error && f.progress >= 100 && (
                      <p className="text-green-600">✓ Subido</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>

  );
};

export default AdvancedFileUploader;
