import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import Button from "../buttons/buttons";

const Firma = ({
  type,
  item,
  info,
  lineaIndex,
  setMemoriaGeneral,
  saveToDB,
  typeMem = "memoria_fase",
}) => {
  const sigCanvasRef = useRef();

  const guardarFirma = () => {
    const base64 = sigCanvasRef.current.getCanvas().toDataURL("image/png");
    setMemoriaGeneral((prev) => {
      const actualizado = {
        ...prev,
        [lineaIndex]: {
          ...prev[lineaIndex],
          [item.clave]: base64,
        },
      };
      saveToDB(typeMem, actualizado);
      return actualizado;
    });
  };

  const limpiarFirma = () => {
    sigCanvasRef.current.clear();
    setMemoriaGeneral((prev) => {
      const actualizado = {
        ...prev,
        [lineaIndex]: {
          ...prev[lineaIndex],
          [item.clave]: "",
        },
      };
      saveToDB(typeMem, actualizado);
      return actualizado;
    });
  };

  if (type !== "signature") return null;

  const firmaValida =
    item.binding && info[item.clave]?.startsWith("data:image");

  return (
    <div className="bg-[#ffffff] border border-gray-700 rounded-xl p-4 space-y-4 shadow-inner">
      {/* Vista previa */}
      {firmaValida && (
        <div className="mb-2">
          <img
            src={info[item.clave]}
            alt="Firma guardada"
            className="max-h-48 w-full object-contain rounded-md border border-gray-600 shadow-md"
          />
        </div>
      )}

      {/* Área de firma */}
      <div className="rounded-lg border-2 border-dashed border-gray-600 overflow-hidden bg-[#ffffff]">
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

      {/* Botones */}
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Button onClick={guardarFirma} variant="save" label="Guardar" />
        <Button onClick={limpiarFirma} variant="cancel" label="Limpiar" />
      </div>
    </div>
  );
};

export default Firma;
