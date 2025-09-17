import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import Button from "../buttons/buttons";

type FirmaBase64Props = {
  onSave: (base64: string) => void;
  onClear?: () => void;
  format?: "png" | "jpeg";         // nuevo: elegir formato
  quality?: number;                // nuevo: calidad para jpeg (0.1 - 1)
  maxWidth?: number;               // nuevo: redimensionar
  maxHeight?: number;
};

const FirmaB64: React.FC<FirmaBase64Props> = ({
  onSave,
  onClear,
  format = "jpeg",
  quality = 0.7,
  maxWidth = 600,
  maxHeight = 300,
}) => {
  const sigCanvasRef = useRef<SignatureCanvas>(null);

  // 🔹 Optimizar y exportar firma
  const optimizarFirma = (canvas: HTMLCanvasElement): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Escalar si es más grande de lo permitido
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }

        const newCanvas = document.createElement("canvas");
        newCanvas.width = width;
        newCanvas.height = height;
        const ctx = newCanvas.getContext("2d");

        if (ctx) {
          // 🔸 Pintar fondo blanco antes de dibujar (evita negro en JPEG)
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);

          // Dibujar la firma encima
          ctx.drawImage(img, 0, 0, width, height);
        }

        // Elegir formato de salida
        const base64 =
          format === "png"
            ? newCanvas.toDataURL("image/png")
            : newCanvas.toDataURL("image/jpeg", quality);

        resolve(base64);
      };
      img.src = canvas.toDataURL("image/png"); // firma original siempre en PNG
    });
  };

  const guardarFirma = () => {
    if (!sigCanvasRef.current) return;
    const canvas = sigCanvasRef.current.getCanvas();

    optimizarFirma(canvas).then((base64) => {
      onSave(base64);
      console.log("Firma optimizada:", base64.slice(0, 80) + "..."); // debug
    });
  };

  const limpiarFirma = () => {
    if (!sigCanvasRef.current) return;
    sigCanvasRef.current.clear();
    if (onClear) onClear();
  };

  return (
    <div className="bg-white border border-gray-300 rounded-xl p-4 space-y-4 shadow-inner">
      <div className="rounded-lg border-2 border-dashed border-gray-400 overflow-hidden bg-white">
        <SignatureCanvas
          ref={sigCanvasRef}
          penColor="#000000"
          canvasProps={{
            width: 400,
            height: 180,
            className: "w-full h-auto",
          }}
        />
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Button onClick={guardarFirma} variant="save" label="Guardar" />
        <Button onClick={limpiarFirma} variant="cancel" label="Limpiar" />
      </div>
    </div>
  );
};

export default FirmaB64;
