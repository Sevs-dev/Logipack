"use client";
import { useEffect, useState, useRef } from "react";
import { getActividadesControl } from "../../services/planing/planingServices";
import Text from "../text/Text";
import SignatureCanvas from "react-signature-canvas";

type ModalControlProps = {
    id?: number | null;
    showModal?: boolean;
    setShowModal?: (v: boolean) => void;
    title?: string;
    className?: string;
};

type Actividad = {
    id: number;
    description: string;
    config: string | any;
    binding: boolean;
};

export default function ModalControl({
    id,
    title = "Registro de Control en Procesos",
    className,
}: ModalControlProps) {
    const heading = title;
    const ref = useRef<HTMLFormElement>(null);
    const [controlData, setControlData] = useState<Actividad[]>([]);
    const [memoriaFase, setMemoriaFase] = useState<Record<string, any>>({});

    // 📝 Guardar valores dinámicos
    const handleChange = (name: string, value: any) => {
        setMemoriaFase((prev) => {
            const updated = {
                ...prev,
                [name]: value,
            };
            return updated;
        });
    };

    // 🔄 Cargar datos fase + actividades
    useEffect(() => {
        if (!id) return;

        getActividadesControl(id).then((data: any) => {
            if (data && Array.isArray(data.actividades)) {
                // Guardar la fase completa en memoria
                setMemoriaFase((prev) => {
                    const updated = {
                        ...prev,
                        fase_control: data.fase_control,
                    };
                    return updated;
                });

                // Guardar actividades
                setControlData(data.actividades);
            } else {
                setControlData([]);
            }
        });
    }, [id]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        
        console.log("Formulario enviado:", memoriaFase);
    };

    return (
        <div className={className ?? "w-full max-w-5xl"}>
            {/* ENCABEZADO Y TARJETA DE INFORMACIÓN (DISEÑO MEJORADO) */}
            <h3 className="text-xl font-bold text-gray-900">{heading}</h3>
            {memoriaFase.fase_control && (
                <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="font-semibold text-gray-800">
                        {memoriaFase.fase_control.descripcion}
                    </p>
                    <p className="text-sm text-gray-500">
                        Tipo: {memoriaFase.fase_control.phase_type}
                    </p>
                </div>
            )}

            {/* Layout principal */}
            <div className="mt-6">
                {/* El formulario ahora ocupa todo el ancho disponible dentro de este contenedor */}
                <form onSubmit={handleSubmit} ref={ref} className="space-y-6">
                    {controlData.map((item, index) => {
                        // --- La lógica para procesar 'config' permanece igual ---
                        let config = item.config;
                        try {
                            if (typeof config === "string") config = JSON.parse(config);
                            if (typeof config === "string") config = JSON.parse(config);
                        } catch (error) {
                            config = {};
                        }
                        const { type, options, min, max, } = config;

                        return (
                            // CADA PREGUNTA ES AHORA UNA TARJETA INDEPENDIENTE (TEMA CLARO)
                            <div
                                key={index}
                                className="rounded-xl border border-gray-200 bg-white p-6
                                 shadow-sm transition-all duration-300 
                                 hover:border-gray-300 hover:shadow-md">
                                <label
                                    htmlFor={`field_${item.id}`}
                                    className="block text-base font-semibold text-gray-900">
                                    {item.description}
                                </label>
                                <p className="mt-1 text-sm text-gray-500">
                                    Selecciona una de las siguientes opciones.
                                </p>

                                {/* --- CAMPO DE TEXTO (TEMA CLARO) --- */}
                                {type === "text" && (
                                    <input
                                        type="text"
                                        id={`field_${item.id}`}
                                        name={`field_${item.id}`}
                                        value={memoriaFase[`field_${item.id}`] ?? ""}
                                        onChange={(e) => handleChange(`field_${item.id}`, e.target.value)}
                                        className="mt-4 block w-full rounded-md border-gray-300 
                                        bg-gray-50 py-2 px-3.5 text-gray-900 shadow-sm ring-1 
                                        ring-inset ring-gray-300 focus:ring-2 focus:ring-inset 
                                        focus:ring-indigo-600 sm:text-sm sm:leading-6 
                                        transition-all duration-150"
                                        required={item.binding}
                                    />
                                )}

                                {/* --- RADIO BUTTONS (TEMA CLARO CON CHECKMARK) --- */}
                                {type === "radio" && Array.isArray(options) && (
                                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {options.map((opt: string) => {
                                            const isSelected = memoriaFase[`field_${item.id}`] === opt;
                                            return (
                                                <label key={opt}
                                                    className={`relative flex cursor-pointer rounded-lg 
                                                        border p-4 shadow-sm transition-all duration-200 focus:outline-none 
                                                        ${isSelected
                                                            ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500" // Estilo SELECCIONADO
                                                            : "border-gray-300 bg-white hover:bg-gray-50" // Estilo NORMAL
                                                        }`}>

                                                    <input type="radio"
                                                        name={`field_${item.id}`}
                                                        value={opt}
                                                        checked={isSelected}
                                                        required={item.binding}
                                                        onChange={(e) =>
                                                            handleChange(`field_${item.id}`, e.target.value)
                                                        }
                                                        className="sr-only"
                                                        aria-labelledby={`${item.id}-${opt}-label`}
                                                    />
                                                    <span id={`${item.id}-${opt}-label`}
                                                        className={`flex-1 text-sm font-medium ${isSelected ? "text-indigo-900" : "text-gray-800"
                                                            }`}>
                                                        {opt}
                                                    </span>

                                                    {/* --- ICONO DE CHECKMARK (NUEVO) --- */}
                                                    {isSelected && (
                                                        <svg
                                                            className="h-5 w-5 text-indigo-600"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor">
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 
                                                                1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 
                                                                00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* TEXTAREA */}
                                {type === "textarea" && (
                                    <textarea
                                        rows={1}
                                        style={{ maxHeight: "15rem" }}
                                        id={`field_${item.id}`}
                                        name={`field_${item.id}`}
                                        value={memoriaFase[`field_${item.id}`] ?? ""}
                                        onChange={(e) => handleChange(`field_${item.id}`, e.target.value)}
                                        className="mt-4 block w-full rounded-md border-gray-300 
                                        bg-gray-50 py-2 px-3.5 text-gray-900 shadow-sm ring-1 
                                        ring-inset ring-gray-300 focus:ring-2 focus:ring-inset 
                                        focus:ring-indigo-600 sm:text-sm sm:leading-6 
                                        transition-all duration-150"
                                        required={item.binding}
                                    />
                                )}

                                {/* NUMBER */}
                                {type === "number" && (
                                    <input
                                        type="number"
                                        id={`field_${item.id}`}
                                        name={`field_${item.id}`}
                                        value={memoriaFase[`field_${item.id}`] ?? ""}
                                        onChange={(e) => handleChange(`field_${item.id}`, e.target.value)}
                                        className="mt-4 block w-full rounded-md border-gray-300 
                                        bg-gray-50 py-2 px-3.5 text-gray-900 shadow-sm ring-1 
                                        ring-inset ring-gray-300 focus:ring-2 focus:ring-inset 
                                        focus:ring-indigo-600 sm:text-sm sm:leading-6 
                                        transition-all duration-150"
                                        required={item.binding}
                                    />
                                )}

                                {/* DATE */}
                                {type === "date" && (
                                    <input
                                        type="date"
                                        id={`field_${item.id}`}
                                        name={`field_${item.id}`}
                                        value={memoriaFase[`field_${item.id}`] ?? ""}
                                        onChange={(e) => handleChange(`field_${item.id}`, e.target.value)}
                                        className="mt-4 block w-full rounded-md border-gray-300 
                                        bg-gray-50 py-2 px-3.5 text-gray-900 shadow-sm ring-1 
                                        ring-inset ring-gray-300 focus:ring-2 focus:ring-inset 
                                        focus:ring-indigo-600 sm:text-sm sm:leading-6 
                                        transition-all duration-150"
                                        required={item.binding}
                                    />
                                )}

                                {/* TIME */}
                                {type === "time" && (
                                    <input
                                        type="time"
                                        id={`field_${item.id}`}
                                        name={`field_${item.id}`}
                                        value={memoriaFase[`field_${item.id}`] ?? ""}
                                        onChange={(e) => handleChange(`field_${item.id}`, e.target.value)}
                                        className="mt-4 block w-full rounded-md border-gray-300 
                                        bg-gray-50 py-2 px-3.5 text-gray-900 shadow-sm ring-1 
                                        ring-inset ring-gray-300 focus:ring-2 focus:ring-inset 
                                        focus:ring-indigo-600 sm:text-sm sm:leading-6 
                                        transition-all duration-150"
                                        required={item.binding}
                                    />
                                )}

                                {/* SELECT */}
                                {type === "select" && (
                                    <select
                                        id={`field_${item.id}`}
                                        name={`field_${item.id}`}
                                        value={memoriaFase[`field_${item.id}`] ?? ""}
                                        onChange={(e) => handleChange(`field_${item.id}`, e.target.value)}
                                        className="mt-4 block w-full rounded-md border-gray-300 
                                        bg-gray-50 py-2 px-3.5 text-gray-900 shadow-sm ring-1 
                                        ring-inset ring-gray-300 focus:ring-2 focus:ring-inset 
                                        focus:ring-indigo-600 sm:text-sm sm:leading-6 
                                        transition-all duration-150"
                                        required={item.binding}>
                                        <option value="">Seleccione</option>
                                        {options.map((opt: string, k: number) => {
                                            return (
                                                <option key={k} value={opt}>
                                                    {opt}
                                                </option>
                                            );
                                        })}
                                    </select>
                                )}

                                {/* CHECKBOX */}
                                {type === "checkbox" && (
                                    <div className="mt-4">
                                        {options.map((opt: string, k: number) => {
                                            return (
                                                <label key={k} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        name={`field_${item.id}`}
                                                        value={opt}
                                                        checked={memoriaFase[`field_${item.id}`]?.includes(opt) || false}
                                                        onChange={(e) => handleChange(`field_${item.id}`, e.target.value)}
                                                        className="h-4 w-4 rounded border-gray-300 
                                                        text-indigo-600 focus:ring-indigo-600 
                                                        transition-colors duration-200"
                                                    />
                                                    <span className="text-sm">{opt}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* IMAGE */}
                                {type === "image" && (
                                    <div className="mt-4">
                                        <input
                                            type="file"
                                            id={`field_${item.id}`}
                                            name={`field_${item.id}`}
                                            accept="image/*"
                                            onChange={(e) => handleChange(`field_${item.id}`, e.target.value)}
                                            className="mt-4 block w-full rounded-md border-gray-300 
                                            bg-gray-50 py-2 px-3.5 text-gray-900 shadow-sm ring-1 
                                            ring-inset ring-gray-300 focus:ring-2 focus:ring-inset 
                                            focus:ring-indigo-600 sm:text-sm sm:leading-6 
                                            transition-all duration-150"
                                            required={item.binding}
                                        />
                                    </div>
                                )}

                                {/* FILE */}
                                {type === "file" && (
                                    <div className="mt-4">
                                        <input
                                            type="file"
                                            id={`field_${item.id}`}
                                            name={`field_${item.id}`}
                                            accept="file/*"
                                            onChange={(e) => handleChange(`field_${item.id}`, e.target.value)}
                                            className="mt-4 block w-full rounded-md border-gray-300 
                                            bg-gray-50 py-2 px-3.5 text-gray-900 shadow-sm ring-1 
                                            ring-inset ring-gray-300 focus:ring-2 focus:ring-inset 
                                            focus:ring-indigo-600 sm:text-sm sm:leading-6 
                                            transition-all duration-150"
                                            required={item.binding}
                                        />
                                    </div>
                                )}

                                {/* TEMPERATURE */}
                                {type === "temperature" && (
                                    <input
                                        type="number"
                                        className="block w-full px-3 py-2 bg-[#1a1d23] border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 text-center"
                                        min={min}
                                        max={max}
                                        step="0.01"
                                        id={`field_${item.id}`}
                                        name={`field_${item.id}`}
                                        value={memoriaFase[`field_${item.id}`] ?? ""}
                                        required={item.binding}
                                        onChange={(e) => handleChange(`field_${item.id}`, e.target.value)}
                                    />
                                )}
                            </div>
                        );
                    })}

                    {/* El botón de envío se mantiene igual, funciona bien en tema claro */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full rounded-md bg-indigo-600 px-4 
                            py-3 text-sm font-semibold text-white shadow-lg 
                            hover:bg-indigo-500 focus-visible:outline 
                            focus-visible:outline-2 focus-visible:outline-offset-2 
                            focus-visible:outline-indigo-600 transition-colors duration-200 
                            disabled:opacity-50">
                            Enviar Respuestas
                        </button>
                    </div>
                </form>
            </div>

            {/* DEBUG - No se toca */}
            {/* <pre className="mt-6 text-xs text-black bg-gray-100 p-3 rounded">
              {JSON.stringify(memoriaFase, null, 2)}
          </pre> */}
        </div>
    );
}
