import React, { useState } from "react";
import AuditHistory from "./AuditHistory";
import Text from "../text/Text";
import Button from "../buttons/buttons";
import { Audit, AuditModalProps } from "../../interfaces/Audit";

const AuditModal: React.FC<AuditModalProps> = ({ audit, onClose }) => {
    const [selectedAudit, setSelectedAudit] = useState<Audit | null>(
        audit.length > 0 ? audit[0] : null
    );

    if (audit.length === 0) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-modal-title"
        >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row gap-6 shadow-lg shadow-black/30 text-gray-100 border border-white/20">
                {/* Panel izquierdo: Lista de historial */}
                <div className="md:w-1/3 flex flex-col h-full">
                    <Text type="title" color="text-[#fff]">
                        Historial
                    </Text>
                    <ul className="flex-1 overflow-y-auto rounded-xl border border-white/20 divide-y divide-white/10 bg-black/10">
                        {audit.map((item) => (
                            <AuditItem
                                key={item.id}
                                item={item}
                                isSelected={selectedAudit?.id === item.id}
                                onSelect={() => setSelectedAudit(item)}
                            />
                        ))}
                    </ul>
                    <div className="flex justify-center gap-4 mt-6">
                        <Button onClick={onClose} variant="cancel" label="Cerrar" />
                    </div>
                </div>

                {/* Panel derecho: Detalle de auditoría seleccionada */}
                <div className="md:w-2/3 bg-white/5 rounded-xl p-4 border border-white/10 shadow-inner">
                    {selectedAudit ? (
                        <AuditHistory
                            audit={selectedAudit}
                            onClose={() => setSelectedAudit(null)} // Solo limpia selección, no cierra modal
                        />
                    ) : (
                        <p className="text-gray-300 italic select-none text-center py-8">
                            Selecciona una auditoría para ver detalles
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

const AuditItem: React.FC<{
    item: Audit;
    isSelected: boolean;
    onSelect: () => void;
}> = ({ item, isSelected, onSelect }) => {
    return (
        <li
            className={`cursor-pointer p-3 hover:bg-white/10 transition-all duration-200 rounded ${isSelected ? "bg-white/20 font-semibold" : ""
                }`}
            onClick={onSelect}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    onSelect();
                }
            }}
            tabIndex={0}
            aria-selected={isSelected}
            role="option"
        >
            <div className="truncate">
                <strong className="capitalize">
                    {new Date(item.created_at).toLocaleString()}
                </strong>
            </div>
        </li>
    );
};

export default AuditModal;
