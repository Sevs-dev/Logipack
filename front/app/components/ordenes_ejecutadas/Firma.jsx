import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

const Firma = ({ type, item, info, lineaIndex, setMemoriaGeneral, saveToDB, typeMem = "memoria_fase" }) => {
    const sigCanvasRef = useRef();

    const guardarFirma = () => {
        const base64 = sigCanvasRef.current.getCanvas().toDataURL("image/png"); // <- sin trimmed
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

    // Validación de firma antes del renderizado
    let firmaValida = true;

    if (type === "signature" && item.binding) {
        const firma = info[item.clave];
        firmaValida = firma && firma.startsWith("data:image");
    }

    return (
        <div>
            {firmaValida && info[item.clave]?.startsWith("data:image") && (
                <div className="mb-2">
                    <img
                        src={info[item.clave]}
                        alt="Firma guardada"
                        className="max-h-48 rounded shadow object-contain"
                    />
                </div>
            )}

            <SignatureCanvas
                ref={sigCanvasRef}
                penColor="black"
                canvasProps={{
                    width: 300,
                    height: 150,
                    className:
                        "border border-gray-300 rounded-md shadow-sm w-full mb-2",
                }}
            />

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={guardarFirma}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                    Guardar
                </button>
                <button
                    type="button"
                    onClick={limpiarFirma}
                    className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                >
                    Limpiar
                </button>
            </div>
        </div>
    );
};

export default Firma;
