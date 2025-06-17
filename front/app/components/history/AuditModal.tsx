import React, { useState, useEffect, useRef } from "react";
import AuditHistory from "./AuditHistory";
import Text from "../text/Text";
import Button from "../buttons/buttons";
import { Audit, AuditModalProps } from "../../interfaces/Audit";

// Estilos globales del scroll
const customScrollStyles = `
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background-color: #fff;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.4);
}
`;

const AuditModal: React.FC<AuditModalProps> = ({ audit, onClose }) => {
    if (audit.length === 0) return null;

    // Orden descendente: más reciente primero
    const sortedAudit = [...audit].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const firstItemRef = useRef<HTMLLIElement>(null);
    const [selectedAudit, setSelectedAudit] = useState<Audit | null>(sortedAudit[0]);

    useEffect(() => {
        firstItemRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, []);

    return (
        <>
            <style>{customScrollStyles}</style>

            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="audit-modal-title"
            >
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 w-full max-w-4xl max-h-[90vh] overflow-auto flex flex-col md:flex-row gap-4 shadow-lg shadow-black/30 text-gray-100 border border-white/20">
                    {/* Panel izquierdo */}
                    <div className="md:w-1/3 flex flex-col h-full max-h-[80vh]">
                        <Text type="title" color="text-[#fff]">Historial</Text>
                        <ul className="flex-1 overflow-y-auto rounded-xl border border-white/20 divide-y divide-white/10 bg-black/10">
                            {sortedAudit.map((item, index) => (
                                <AuditItem
                                    key={item.id}
                                    item={item}
                                    isSelected={selectedAudit?.id === item.id}
                                    onSelect={() => setSelectedAudit(item)}
                                    ref={index === 0 ? firstItemRef : null} // Primer ítem (más reciente)
                                />
                            ))}
                        </ul>
                        <div className="flex justify-center gap-4 mt-4">
                            <Button onClick={onClose} variant="cancel" label="Cerrar" />
                        </div>
                    </div>

                    {/* Panel derecho */}
                    <div className="md:w-2/3 bg-white/5 rounded-xl p-4 border border-white/10 shadow-inner h-full max-h-[80vh] overflow-y-auto">
                        {selectedAudit ? (
                            <AuditHistory
                                audit={selectedAudit}
                                onClose={() => setSelectedAudit(null)}
                            />
                        ) : (
                            <p className="text-gray-300 italic select-none text-center py-8">
                                Selecciona una auditoría para ver detalles
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

const AuditItem = React.forwardRef<HTMLLIElement, {
    item: Audit;
    isSelected: boolean;
    onSelect: () => void;
}>(({ item, isSelected, onSelect }, ref) => {
    return (
        <li
            ref={ref}
            className={`cursor-pointer p-3 hover:bg-white/10 transition-all duration-200 rounded ${isSelected ? "bg-white/20 font-semibold" : ""}`}
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
});

AuditItem.displayName = "AuditItem";

export default AuditModal;
