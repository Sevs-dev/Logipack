import React, { useState } from 'react'
import ModalSection from "../modal/ModalSection";
import Text from "../text/Text";

const ModalControl = ({ id }: { id: number }, showModal: boolean, setShowModal: (value: boolean) => void) => {
    console.log(id);
    const [controlData, setControlData] = useState<any[]>([]);

    // 🧾 Actualizar valores del formulario dinámico
    // const handleChange = (actividadId: number, newValue: any) => {
    //     setControlData(prev =>
    //         prev.map(act =>
    //             act.id_activitie === actividadId ? { ...act, valor: newValue } : act
    //         )
    //     );
    // };

    return (
        <div>
            {/* Modal de control */}
            {showModal && (
                <ModalSection isVisible={showModal} onClose={() => setShowModal(false)}>
                    

                    {/* Botones de acción */}
                    <hr className="my-4 border-t border-gray-600 w-full max-w-lg mx-auto opacity-60" />
                    <div className="flex justify-center gap-4 mt-6">
                        <button
                            onClick={() => {
                                setShowModal(false);
                                // handleSaveTimerData();
                                // handleReset();
                                // handleResetValue();
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700"
                        >
                            Guardar y reiniciar timer
                        </button>
                    </div>
                </ModalSection>
            )}
        </div>
    )
}

export default ModalControl
