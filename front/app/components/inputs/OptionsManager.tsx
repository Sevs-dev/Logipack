import React from "react";
import { Plus, X } from "lucide-react"; // o cualquier ícono que uses

type Props = {
    options: string[];
    onChange: (newOptions: string[]) => void;
    maxOptions?: number;
};

const OptionsManager: React.FC<Props> = ({ options, onChange, maxOptions = 20 }) => {
    const handleChange = (index: number, value: string) => {
        const updated = [...options];
        updated[index] = value;
        onChange(updated);
    };

    const handleAdd = () => {
        if (options.length >= maxOptions) return;
        onChange([...options, ""]);
    };

    const handleRemove = (index: number) => {
        const updated = options.filter((_, i) => i !== index);
        onChange(updated);
    };

    return (
        <div className="space-y-3">
            {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleChange(i, e.target.value)}
                        className="flex-grow rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-black"
                        placeholder={`Opción ${i + 1}`}
                    />
                    <button
                        type="button"
                        onClick={() => handleRemove(i)}
                        className="p-2 rounded-md bg-red-600 hover:bg-red-400 text-white transition"
                        aria-label="Eliminar opción"
                    >
                        <X size={18} />
                    </button>
                </div>
            ))}
            {options.length < maxOptions && (
                <button
                    type="button"
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition"
                >
                    <Plus size={16} />
                    <span>Agregar opción</span>
                </button>
            )}
        </div>
    );
};

export default OptionsManager;
