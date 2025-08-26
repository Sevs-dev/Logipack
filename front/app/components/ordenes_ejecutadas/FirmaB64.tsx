import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import Button from "../buttons/buttons";

type FirmaBase64Props = {
  onSave: (base64: string) => void; // callback para devolver el resultado
  onClear?: () => void;             // opcional, por si quieres escuchar cuando se limpia
};

const FirmaB64: React.FC<FirmaBase64Props> = ({ onSave, onClear }) => {
  const sigCanvasRef = useRef<SignatureCanvas>(null);

  const guardarFirma = () => {
    if (!sigCanvasRef.current) return;
    const base64 = sigCanvasRef.current.getCanvas().toDataURL("image/png");
    onSave(base64); // solo retornamos al padre
    console.log(base64);
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
