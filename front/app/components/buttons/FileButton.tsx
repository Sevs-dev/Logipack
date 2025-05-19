'use client'
import React, { ChangeEvent, useState } from "react";
import { FaFileAlt } from "react-icons/fa";

interface FileButtonProps {
  onChange: (file: File | null) => void;
}

const FileButton: React.FC<FileButtonProps> = ({ onChange }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0) ?? null;

    if (file && file.size > 5 * 1024 * 1024) {
      alert("El archivo es demasiado grande, máximo 5MB");
      e.target.value = "";
      setFileName(null);
      onChange(null);
      return;
    }

    setFileName(file?.name || null);
    onChange(file);
  };

  return (
    <div className="flex justify-center">
      <label
        htmlFor="file-upload"
        className="relative w-fit max-w-sm mx-auto px-4 py-2 rounded-lg border-2 border-blue-500 bg-gray-50 flex items-center space-x-2 cursor-pointer"
      >
        <FaFileAlt className="text-blue-500" size={20} />
        <span className="text-gray-700 font-semibold text-sm">
          {fileName ? `Archivo: ${fileName}` : "Arrastra o selecciona archivos"}
        </span>
        <input
          id="file-upload"
          type="file"
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Subir archivo"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};

export default FileButton;
