import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

const Firma = ({ type, item, info, lineaIndex, setMemoriaGeneral, saveToDB, typeMem = "memoria_fase" }) => {
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

    let firmaValida = true;

    if (type === "signature" && item.binding) {
        const firma = info[item.clave];
        firmaValida = firma && firma.startsWith("data:image");
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-md space-y-4 max-w-md mx-auto">
            {firmaValida && info[item.clave]?.startsWith("data:image") && (
                <div className="mb-2">
                    <img
                        src={info[item.clave]}
                        alt="Firma guardada"
                        className="max-h-48 w-full object-contain rounded-lg border border-gray-300 shadow"
                    />
                </div>
            )}

            <div className="border-2 border-dashed border-gray-400 rounded-lg overflow-hidden">
                <SignatureCanvas
                    ref={sigCanvasRef}
                    penColor="#1f2937" // gray-800
                    canvasProps={{
                        width: 300,
                        height: 150,
                        className: "w-full h-auto",
                    }}
                />
            </div>

            <div className="flex gap-3 justify-end">
                <button
                    type="button"
                    onClick={guardarFirma}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
                >
                    Guardar
                </button>
                <button
                    type="button"
                    onClick={limpiarFirma}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow transition"
                >
                    Limpiar
                </button>
            </div>
        </div>
    );
};

export default Firma;
