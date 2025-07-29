"use client";
// ------------------------- 1. Importaciones de dependencias principales -------------------------
import React, { useState, useEffect, useCallback } from "react";
import { Search, X, Clock } from "lucide-react";
// ------------------------- 2. Importaciones de servicios -------------------------
import { createMaestra, getMaestra, deleteMaestra, getMaestraId, updateMaestra } from "../../services/maestras/maestraServices";
import { getStage, getStageId } from "../../services/maestras/stageServices";
import { getStage as listTipoAcondicionamiento, getStageById as lisTipoacondicionamientoId } from "@/app/services/maestras/TipoAcondicionamientoService";
import { getAuditsByModel } from "../../services/history/historyAuditServices";
import { getProduct } from "../../services/userDash/productServices"
// ------------------------- 3. Importaciones de componentes de la UI -------------------------
import Button from "../buttons/buttons";
import { showSuccess, showError, showConfirm } from "../toastr/Toaster";
import Text from "../text/Text";
import Table from "../table/Table";
import ModalSection from "../modal/ModalSection";
import { InfoPopover } from "../buttons/InfoPopover";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
import AuditModal from "../history/AuditModal";
// ------------------------- 5. Tipos de datos e interfaces -------------------------
import { MaestraBase } from "../../interfaces/NewMaestra";
import { Stage, StageFase } from "../../interfaces/NewStage";
import { Product } from "../../interfaces/Products";
import { DataTipoAcondicionamiento, DataLineaTipoAcondicionamiento } from "@/app/interfaces/NewTipoAcondicionamiento";
import { getLineaTipoAcondicionamientoById as getLineaTipoAcomById } from "@/app/services/maestras/LineaTipoAcondicionamientoService";
import { Audit } from "../../interfaces/Audit";
import DateLoader from '@/app/components/loader/DateLoader';
// importaciones de interfaces

const Maestra = ({ canEdit = false, canView = false }: CreateClientProps) => {
    // Estados del componente
    const [isOpen, setIsOpen] = useState(false);
    const [maestra, setMaestra] = useState<MaestraBase[]>([]);
    const [editingMaestra, setEditingMaestra] = useState<MaestraBase | null>(null);
    const [descripcion, setDescripcion] = useState("");
    const [requiereBOM, setRequiereBOM] = useState(false);
    const [estado, setEstado] = useState("");
    const [aprobado, setAprobado] = useState(false);
    const [paralelo, setParalelo] = useState(false);
    const [stages, setStages] = useState<Stage[]>([]);
    const [selectedStages, setSelectedStages] = useState<StageFase[]>([]);
    const [tipoSeleccionado, setTipoSeleccionado] = useState("");
    const [tiposProducto, setTiposProducto] = useState<Product[]>([]);
    const [searchStage, setSearchStage] = useState("");
    const [duration, setDuration] = useState("");
    const [durationUser, setDurationUser] = useState("");
    const [listTipoAcom, setListTipoAcom] = useState<DataTipoAcondicionamiento[]>([]);
    const [, setStagesAcon] = useState<DataLineaTipoAcondicionamiento[]>([]);
    const [tipoSeleccionadoAcon, setTipoSeleccionadoAcon] = useState<number[]>([]);
    const [detalleAcondicionamiento, setDetalleAcondicionamiento] = useState<DataLineaTipoAcondicionamiento[]>([]);
    const [searchTipoAcom, setSearchTipoAcom] = useState("");
    const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
    const [auditList, setAuditList] = useState<Audit[]>([]);
    const [, setSelectedAudit] = useState<Audit | null>(null);
    const [fasesBloqueadas, setFasesBloqueadas] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false);


    const handleSelectTipoAcondicionamiento = async (tipoId: number) => {
        try {
            const seleccionados = Array.isArray(tipoSeleccionadoAcon) ? tipoSeleccionadoAcon : [];
            const yaSeleccionado = seleccionados.includes(tipoId);
            let nuevosSeleccionados: number[] = [];

            // console.log("[🔁 Click en tipo]", { tipoId, yaSeleccionado, seleccionados });

            if (yaSeleccionado) {
                const noSePuedeEliminar = detalleAcondicionamiento.some(
                    item => item.tipo_acondicionamiento_id === tipoId && item.editable === false
                );

                if (noSePuedeEliminar) {
                    console.warn("🚫 Tipo no editable, cancelando");
                    showError("Este tipo de acondicionamiento no se puede eliminar porque contiene fases no editables.");
                    return;
                }

                nuevosSeleccionados = seleccionados.filter(id => id !== tipoId);

                const fasesAEliminar = detalleAcondicionamiento
                    .filter(item => item.tipo_acondicionamiento_id === tipoId)
                    .map(item => Number(item.fase));

                // console.log("🗑️ Deseleccionado:", { fasesAEliminar });

                setStagesAcon(prev => prev.filter(item => item.tipo_acondicionamiento_id !== tipoId));
                setDetalleAcondicionamiento(prev => prev.filter(item => item.tipo_acondicionamiento_id !== tipoId));
                setSelectedStages(prev => prev.filter(stage => !fasesAEliminar.includes(stage.id)));
                setFasesBloqueadas(prev => {
                    const updated = prev.filter(id => !fasesAEliminar.includes(id));
                    // console.log("🧹 Fases bloqueadas actualizadas:", updated);
                    return updated;
                });
            } else {
                nuevosSeleccionados = [...seleccionados, tipoId];

                // console.log("📥 Seleccionando nuevo tipo:", tipoId);

                const response = await lisTipoacondicionamientoId(tipoId);
                const dataArray = Array.isArray(response) ? response : response.data || [];

                // console.log("📦 Fases del backend (lisTipoacondicionamientoId):", dataArray);

                setStagesAcon(prev => {
                    const combined = [...prev, ...dataArray];
                    const result = combined.filter((item, index, self) =>
                        index === self.findIndex(t =>
                            t.id === item.id && t.tipo_acondicionamiento_id === item.tipo_acondicionamiento_id
                        )
                    );
                    // console.log("📄 setStagesAcon =>", result);
                    return result;
                });

                setStages(prev => {
                    const combined = [...prev, ...dataArray];
                    const deduplicados = combined.filter((item, index, self) =>
                        index === self.findIndex(t => t.id === item.id)
                    );
                    const ordenados = deduplicados.sort((a, b) => a.description.localeCompare(b.description));
                    // console.log("📋 setStages =>", ordenados);
                    return ordenados;
                });

                const detalle = await getLineaTipoAcomById(tipoId);
                const detalleArray = Array.isArray(detalle) ? detalle : detalle.data || [];

                // console.log("🔍 Detalle de fases (getLineaTipoAcomById):", detalleArray);

                setDetalleAcondicionamiento(prev => {
                    const combined = [...prev, ...detalleArray];
                    const result = combined.filter((item, index, self) =>
                        index === self.findIndex(t =>
                            t.fase === item.fase && t.tipo_acondicionamiento_id === item.tipo_acondicionamiento_id
                        )
                    );
                    // console.log("📄 setDetalleAcondicionamiento =>", result);
                    return result;
                });

                const nuevasFasesBloqueadas = detalleArray.map((d: DataLineaTipoAcondicionamiento) => Number(d.fase));
                setFasesBloqueadas(prev => {
                    const result = [...new Set([...prev, ...nuevasFasesBloqueadas])];
                    // console.log("⛔ Fases bloqueadas agregadas:", result);
                    return result;
                });

                const fasesSeleccionadas = (
                    await Promise.all(
                        detalleArray.map(async (d: DataLineaTipoAcondicionamiento) => {
                            if (!d?.fase) return null;
                            try {
                                const stageData = await getStageId(Number(d.fase));
                                const descripcion = stageData?.description?.trim();
                                if (!descripcion) return null;

                                return {
                                    id: Number(d.fase),
                                    description: descripcion,
                                    duration: stageData.duration ?? "",
                                    duration_user: stageData.duration_user ?? "",
                                    phase_type: stageData.phase_type ?? "",
                                } satisfies StageFase;
                            } catch {
                                console.warn("❌ Error al obtener fase ID:", d.fase);
                                return null;
                            }
                        })
                    )
                ).filter((f): f is StageFase => f !== null);

                // console.log("✅ Fases seleccionadas construidas:", fasesSeleccionadas);

                setSelectedStages(prev => {
                    const combined = [...prev, ...fasesSeleccionadas];
                    const unique = combined.filter((item, index, self) =>
                        index === self.findIndex(t => t.id === item.id)
                    );
                    // console.log("🧠 setSelectedStages =>", unique);
                    return unique;
                });
            }

            setTipoSeleccionadoAcon(nuevosSeleccionados);
            // console.log("🆕 tipoSeleccionadoAcon actualizado:", nuevosSeleccionados);

            if (nuevosSeleccionados.length === 0) {
                // console.log("🔁 Reset general de fases y detalles");
                setStagesAcon([]);
                setDetalleAcondicionamiento([]);
                setSelectedStages([]);
                setFasesBloqueadas([]);
            }
        } catch (error) {
            console.error("💥 Error al obtener fases o detalles:", error);
            setStages([]);
            setSelectedStages([]);
            setFasesBloqueadas([]);
        }
    };

    const handleSelectStage = (stage: StageFase) => {
        // Si la etapa ya está seleccionada, no hacemos nada
        if (selectedStages.some(s => s.id === stage.id)) return;
        setSelectedStages(prev => [...prev, stage]);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        // No toques draggedIndex aquí
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const reorderedStages = [...selectedStages];
        const [movedStage] = reorderedStages.splice(draggedIndex, 1);
        reorderedStages.splice(index, 0, movedStage);

        setSelectedStages(reorderedStages);
        setDraggedIndex(null);
    };

    const handleRemoveStage = (stage: StageFase) => {
        setSelectedStages(prev => prev.filter(s => s.id !== stage.id));
    };

    useEffect(() => {
        const getListTipoAcom = async () => {
            try {
                const response = await listTipoAcondicionamiento();
                setListTipoAcom(response);
            } catch {
                console.error("Error al cargar los tipos de acondicionamiento");
            }
        };

        getListTipoAcom();
    }, []);

    // Fetch de fases al cargar el componente
    useEffect(() => {
        const fetchStages = async () => {
            try {
                const stages = await getStage(); // Cargar todas las fases
                setStages(stages);
            } catch {
                console.error("Error fetching stages:");
            }
        };
        fetchStages();
    }, []);

    // Fetch de maestras al cargar el componente
    const fetchMaestra = useCallback(async () => {
        try {
            const datas = await getMaestra();
            setMaestra(datas);
        } catch {
            console.error("Error fetching maestras:");
        }
    }, []);

    useEffect(() => {
        if (canView) {
            fetchMaestra();
        }
    }, [fetchMaestra, canView]);

    // Cargar los tipos cuando el componente se monte
    useEffect(() => {
        const fetchTipos = async () => {
            try {
                const tipos = await getProduct();
                // console.log(tipos);
                setTiposProducto(tipos)
            } catch {
                console.error('Error al obtener los tipos');
            }
        };

        fetchTipos();
    }, []);

    // Validación y envío del formulario
    const handleSubmit = async () => {
        if (isSaving) return;
        setIsSaving(true);
        if (!descripcion.trim()) {
            showError("La descripción es obligatoria");
            setIsSaving(false);
            return;
        }
        if (tipoSeleccionado.length === 0) {
            showError("Debes seleccionar al menos un tipo de producto");
            setIsSaving(false);
            return;
        }
        if (selectedStages.length === 0) {
            showError("Debes seleccionar al menos una fase");
            setIsSaving(false);
            return;
        }

        if (!selectedStages.some(stage => stage.phase_type === "Procesos")) {
            showError("Debes incluir al menos una fase de tipo 'Procesos'");
            setIsSaving(false);
            return;
        }

        if (!selectedStages.some(stage => stage.phase_type === "Control")) {
            showError("Debes incluir al menos una fase de tipo 'Control'");
            setIsSaving(false);
            return;
        }
        const payload = {
            descripcion,
            requiere_bom: requiereBOM,
            type_product: tipoSeleccionado,
            type_stage: selectedStages.map(s => s.id),
            status_type: "En Creación",
            aprobado,
            paralelo,
            duration,
            duration_user: durationUser,
            ...(tipoSeleccionadoAcon != null && {
                type_acondicionamiento: tipoSeleccionadoAcon,
            }),
        };
        console.groupEnd();

        try {
            await createMaestra(payload);
            showSuccess("Maestra creada con éxito");
            setIsOpen(false);
            resetForm();
            fetchMaestra();
        } catch {
            console.log(payload);
            showError("Error al crear la maestra");
        } finally {
            setIsSaving(false); // Desactiva loading
        }
    };

    // Eliminar una maestra
    const handleDelete = async (id: number) => {
        showConfirm("¿Estás seguro de eliminar este maestra?", async () => {
            try {
                await deleteMaestra(id);
                setMaestra((prevMaestra) => prevMaestra.filter((maestra) => maestra.id !== id));
                showSuccess("Maestra eliminada exitosamente");
                fetchMaestra(); // Refrescar la lista
            } catch {
                console.error("Error al eliminar maestra:");
                showError("Error al eliminar maestra");
            }
        });
    };

    // Abrir modal de creación
    const openCreateModal = () => {
        setEditingMaestra(null);
        resetForm();
        setIsOpen(true);
    };

    // Abrir modal de edición
    const handleEdit = async (id: number) => {
        try {
            // Asegurarse de que las fases estén cargadas antes de continuar
            if (stages.length === 0) {
                const loadedStages = await getStage();
                setStages(loadedStages);
            }
            const data = await getMaestraId(id);
            setEditingMaestra(data);
            setDescripcion(data.descripcion);
            setRequiereBOM(data.requiere_bom);
            setTipoSeleccionado(data.type_product);
            setEstado(data.status_type);
            setAprobado(data.aprobado);
            setParalelo(data.paralelo);
            setDuration(data.duration);
            setDurationUser(data.duration_user);
            const tiposAcond = Array.isArray(data.type_acondicionamiento)
                ? data.type_acondicionamiento
                : data.type_acondicionamiento != null
                    ? [data.type_acondicionamiento]
                    : [];
            setTipoSeleccionadoAcon(tiposAcond);
            setStagesAcon([]);
            setDetalleAcondicionamiento([]);
            setSelectedStages([]);
            let currentStages = stages;
            if (currentStages.length === 0) {
                currentStages = await getStage();
                setStages(currentStages);
            }
            for (const tipoId of tiposAcond) {
                const response = await lisTipoacondicionamientoId(tipoId);
                const dataArray = Array.isArray(response) ? response : response.data || [];

                setStagesAcon(prev => {
                    const combined = [...prev, ...dataArray];
                    return combined.filter((item, index, self) =>
                        index === self.findIndex(t => t.id === item.id)
                    );
                });

                const detalle = await getLineaTipoAcomById(tipoId);
                const detalleArray: DataLineaTipoAcondicionamiento[] = Array.isArray(detalle) ? detalle : detalle.data || [];

                setDetalleAcondicionamiento(prev => {
                    const combined = [...prev, ...detalleArray];
                    return combined.filter(
                        (item, index, self) =>
                            index === self.findIndex(
                                t => t.fase === item.fase && t.tipo_acondicionamiento_id === item.tipo_acondicionamiento_id
                            )
                    );
                });

                // Aquí obtenemos las fases asociadas y las agregamos a selectedStages
                const fasesSeleccionadas = await Promise.all(
                    detalleArray.map(async (d) => {
                        if (!d?.fase) return null;
                        try {
                            const stageData = await getStageId(Number(d.fase));
                            const descripcion = stageData?.description?.trim();
                            if (!descripcion) return null;
                            return {
                                id: Number(d.fase),
                                description: descripcion,
                                duration: stageData.duration ?? "",
                                duration_user: stageData.duration_user ?? "",
                            } as StageFase;
                        } catch {
                            return null;
                        }
                    })
                );

                setSelectedStages(prev => {
                    const combined = [...prev, ...fasesSeleccionadas.filter(Boolean) as StageFase[]];
                    return combined.filter((item, index, self) =>
                        index === self.findIndex(t => t.id === item.id)
                    );
                });
            }


            // Stages generales (no por acondicionamiento) 
            const selectedStageIds = data.type_stage;

            const selectedStagesOrdered = await Promise.all(
                selectedStageIds.map(async (stageId: number) => {
                    try {
                        const stageData = await getStageId(stageId);
                        const descripcion = stageData?.description?.trim();
                        if (!descripcion) return null;
                        return {
                            id: stageId,
                            description: descripcion,
                            duration: stageData.duration ?? "",
                            duration_user: stageData.duration_user ?? "",
                        } as StageFase;
                    } catch {
                        console.warn("❌ Error obteniendo stage ID:", stageId);
                        return null;
                    }
                })
            );

            setSelectedStages(selectedStagesOrdered.filter((s): s is StageFase => s !== null));
            setIsOpen(true);
        } catch {
            console.error("Error obteniendo datos de la Maestra:");
            showError("Error obteniendo datos de la Maestra");
        }
    };

    // Actualizar una maestra
    const handleUpdate = async () => {
        if (isSaving) return;
        if (!editingMaestra) return;
        setIsSaving(true);
        if (!descripcion.trim()) {
            showError("La descripción es obligatoria");
            setIsSaving(false);
            return;
        }
        if (tipoSeleccionado.length === 0) {
            showError("Debes seleccionar al menos un tipo de producto");
            setIsSaving(false);
            return;
        }
        if (selectedStages.length === 0) {
            showError("Debes seleccionar al menos una fase");
            setIsSaving(false);
            return;
        }

        if (!selectedStages.some(stage => stage.phase_type === "Procesos")) {
            showError("Debes incluir al menos una fase de tipo 'Procesos'");
            setIsSaving(false);
            return;
        }

        if (!selectedStages.some(stage => stage.phase_type === "Control")) {
            showError("Debes incluir al menos una fase de tipo 'Control'");
            setIsSaving(false);
            return;
        }

        try {
            await updateMaestra(editingMaestra.id, {
                descripcion,
                requiere_bom: requiereBOM,
                type_product: tipoSeleccionado,
                type_stage: selectedStages.map((s) => s.id),
                status_type: estado,
                aprobado,
                paralelo,
                duration,
                duration_user: durationUser,
                ...(tipoSeleccionadoAcon != null && {
                    type_acondicionamiento: tipoSeleccionadoAcon,
                }),
            });
            showSuccess("Maestra actualizada con éxito");
            setIsOpen(false);
            resetForm();
            fetchMaestra();
        } catch {
            showError("Error al actualizar la maestra");
        } finally {
            setIsSaving(false); // Desactiva loading
        }
    };

    // Resetear el formulario
    const resetForm = () => {
        setDescripcion("");
        setRequiereBOM(false);
        setTipoSeleccionado("");
        setEstado("");
        setAprobado(false);
        setParalelo(false);
        setSelectedStages([]);
        setDuration("");
        setDurationUser("");
        setTipoSeleccionadoAcon([]);
        setSearchStage("");
    };

    useEffect(() => {
        // console.log("Selected Stages:", selectedStages);
        const totalDuration = selectedStages.reduce((total, stage) => total + (Number(stage.duration) || 0), 0);
        const totalUserDuration = selectedStages.reduce((total, stage) => total + (Number(stage.duration_user) || 0), 0);

        setDuration(String(totalDuration));
        setDurationUser(String(totalUserDuration));
    }, [selectedStages]);

    const getFormattedDuration = (input: number | string): string => {
        let totalSeconds = 0;

        if (typeof input === "string") input = input.replace(",", ".");
        const num = typeof input === "number" ? input : parseFloat(input);

        if (isNaN(num) || num <= 0) return "0 seg";

        // Si el número tiene decimales, los decimales son segundos (ej: 0.10 => 10 seg)
        const [minStr, secStr] = num.toString().split(".");
        const mins = parseInt(minStr, 10) || 0;
        const secs = secStr ? parseInt(secStr.padEnd(2, "0").slice(0, 2), 10) : 0;
        totalSeconds = mins * 60 + secs;

        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const parts: string[] = [];
        const pushPart = (value: number, singular: string, plural: string = singular + 's') => {
            if (value > 0) parts.push(`${value} ${value === 1 ? singular : plural}`);
        };

        pushPart(days, 'día');
        pushPart(hours, 'hora');
        pushPart(minutes, 'min', 'min');

        const shouldShowSeconds = totalSeconds < 3600 && seconds > 0 && days === 0 && hours === 0;
        if (shouldShowSeconds) {
            pushPart(seconds, 'seg', 'seg');
        }

        return parts.join(' ');
    };

    const selectedId = (tipoSeleccionadoAcon ?? [])[0]; // solo toma uno

    const handleHistory = async (id: number) => {
        const model = "Maestra";
        try {
            const data = await getAuditsByModel(model, id);
            console.log(data)
            setAuditList(data);
            if (data.length > 0) setSelectedAudit(data[0]); // opción: mostrar la primera al abrir
        } catch {
            console.error("Error al obtener la auditoría:");
        }
    };

    return (
        <div>
            {/* Botón para abrir el modal de creación */}
            {canEdit && (
                <div className="flex justify-center space-x-2 mb-2">
                    <Button onClick={openCreateModal} variant="create" label="Crear Maestra" />
                </div>
            )}

            {isSaving && (
                <DateLoader message="Cargando..." backgroundColor="rgba(0, 0, 0, 0.28)" color="rgba(255, 255, 0, 1)" />
            )}
            {/* Modal de creación/edición */}
            {isOpen && (
                <ModalSection isVisible={isOpen} onClose={() => { setIsOpen(false) }}>
                    <Text type="title" color="text-[#000]">{editingMaestra ? "Editar Maestra" : "Crear Maestra"}</Text>
                    {/* Descripción */}
                    <div className="mt-4">
                        <Text type="subtitle" color="#000">Descripción</Text>
                        <input
                            type="text"
                            placeholder="Descripción"
                            className="w-full p-2 border text-black mb-2 min-w-0 text-center"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            disabled={!canEdit}
                        />
                    </div>

                    {/* Requiere BOM y Aprobado */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4 mb-2">
                        <div className="flex flex-col items-center">
                            <Text type="subtitle" color="#000">Requiere BOM
                                <InfoPopover content={<>Indica que este acondicionamiento requiere una <strong>BOM</strong>. Esto se aplicará al crear la orden de acondicionamiento.</>} />
                            </Text>
                            <input
                                type="checkbox"
                                checked={requiereBOM}
                                onChange={() => setRequiereBOM(!requiereBOM)}
                                className="mt-2 w-4 h-4"
                                disabled={!canEdit}
                            />
                        </div>
                        <div className="flex flex-col items-center">
                            <Text type="subtitle" color="#000">Paralelo
                                <InfoPopover content={<>
                                    <strong>Paralelo</strong> indica que esta fase puede ejecutarse simultáneamente con otras, es decir, trabaja múltiples líneas al mismo tiempo.
                                </>} />
                            </Text>
                            <input
                                type="checkbox"
                                checked={paralelo}
                                onChange={() => setParalelo(!paralelo)}
                                className="mt-2 w-4 h-4"
                                disabled={!canEdit}
                            />
                        </div>
                        <div className="flex flex-col items-center">
                            <Text type="subtitle" color="#000">Seleccione Tipo de Producto
                                <InfoPopover content={
                                    <>
                                        Selecciona uno de los productos previamente creados en la sección <strong>Productos</strong>.
                                    </>
                                } />
                            </Text>
                            <select
                                className="w-full p-2 border mb-2 min-w-0 text-black text-center"
                                value={tipoSeleccionado}
                                onChange={(e) => setTipoSeleccionado(e.target.value)}
                                disabled={!canEdit}
                            >
                                <option value="" disabled>
                                    -- Seleccione un tipo de producto --
                                </option>
                                {tiposProducto.map((tipo) => (
                                    <option key={tipo.id} value={tipo.id} className="text-black">
                                        {tipo.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Selección de Fases */}
                    <div className="mt-4">
                        <Text type="subtitle" color="#000">Seleccione las Fases</Text>
                        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                            <div className="w-full md:w-1/2 border p-4 max-h-60 overflow-y-auto rounded-xl bg-white shadow-sm">
                                <Text type="subtitle">Acond. Disponibles
                                    <InfoPopover
                                        content={
                                            <>
                                                Selecciona un tipo de acondicionamiento de la lista. <br />
                                                El tipo seleccionado se mostrará con un <strong>✓</strong> y resaltado en <span className="text-green-600 font-semibold">verde</span>. <br />
                                                Puedes buscar por nombre en el campo superior. Solo se permite una selección a la vez.
                                            </>
                                        }
                                    />
                                </Text>
                                <div className="relative mb-3">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Buscar tipo..."
                                        className="w-full border border-gray-300 p-2 pl-9 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={searchTipoAcom}
                                        onChange={(e) => setSearchTipoAcom(e.target.value)}
                                        disabled={!canEdit}
                                    />
                                </div>

                                {listTipoAcom.length > 0 ? (
                                    listTipoAcom
                                        .filter((tipo) =>
                                            tipo.descripcion.toLowerCase().includes(searchTipoAcom.toLowerCase())
                                        )
                                        .map((tipo) => {
                                            const isSelected = tipo.id === selectedId;
                                            return (
                                                <div key={tipo.id} className="p-2 border-b">
                                                    <button
                                                        className={`w-full text-sm transition text-center ${isSelected
                                                            ? "text-green-600 font-semibold"
                                                            : "text-blue-500 hover:text-blue-700"
                                                            }`}
                                                        onClick={() => handleSelectTipoAcondicionamiento(tipo.id)}
                                                        disabled={!canEdit}
                                                    >
                                                        {isSelected ? `✓ ${tipo.descripcion}` : tipo.descripcion}
                                                    </button>
                                                </div>
                                            );
                                        })

                                ) : (
                                    <p className="text-gray-500 text-center">No hay tipos disponibles</p>
                                )}

                            </div>

                            {/* Lista de fases disponibles */}
                            <div className="w-full md:w-1/2 border p-4 max-h-60 overflow-y-auto rounded-xl bg-white shadow-sm">
                                <Text type="subtitle">Fases Disponibles
                                    <InfoPopover
                                        content={
                                            <>
                                                Solo se puede seleccionar una fase de tipo <strong>Control</strong> y una de tipo <strong>Procesos</strong>. <br />
                                                Además, se excluyen fases ya seleccionadas, bloqueadas o que no coincidan con la búsqueda.
                                            </>
                                        }
                                    />

                                </Text>

                                <div className="relative mb-3">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Buscar fase..."
                                        className="w-full border border-gray-300 p-2 pl-9 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={searchStage}
                                        onChange={(e) => setSearchStage(e.target.value)}
                                        disabled={!canEdit}
                                    />
                                </div>

                                {stages.length > 0 ? (
                                    stages
                                        .filter(stage => stage.status !== false)
                                        .filter(stage => {
                                            const yaSeleccionada = selectedStages.some(s => s.id === stage.id);
                                            const estaBloqueada = fasesBloqueadas.includes(stage.id);
                                            const coincideBusqueda = stage.description.toLowerCase().includes(searchStage.toLowerCase());
                                            const yaHayControl = selectedStages.some(s => s.phase_type?.toLowerCase() === "control");
                                            const yaHayProcesos = selectedStages.some(s => s.phase_type?.toLowerCase() === "procesos");
                                            const currentType = stage.phase_type?.toLowerCase();
                                            const esTipoUnico = (currentType === "control" && yaHayControl) ||
                                                (currentType === "procesos" && yaHayProcesos);
                                            return !yaSeleccionada && !estaBloqueada && coincideBusqueda && !esTipoUnico;
                                        })
                                        .map(stage => (
                                            <div key={stage.id} className="p-2 border-b">
                                                <button
                                                    disabled={!canEdit}
                                                    className="w-full text-sm text-center text-blue-500 hover:text-blue-700 transition"
                                                    onClick={() => handleSelectStage(stage)}
                                                >
                                                    {stage.description}
                                                </button>
                                            </div>
                                        ))
                                ) : (
                                    <p className="text-gray-500 text-center">No hay fases disponibles</p>
                                )}

                            </div>

                            {/* Lista de fases seleccionadas */}
                            <div className="w-full md:w-1/2 p-4 rounded-xl bg-white border shadow-sm">
                                <Text type="subtitle">Fases Seleccionadas
                                    <InfoPopover
                                        content={
                                            <>
                                                Estas son las <strong>fases seleccionadas</strong> del acondicionamiento.<br />
                                                Puedes <span className="text-red-500 font-medium">reordenarlas</span> arrastrándolas con el ícono ☰ si la edición está habilitada.<br />
                                                Haz clic sobre una fase para eliminarla, salvo que esté marcada como <span className="text-gray-500">no editable</span>.
                                            </>
                                        }
                                    />

                                </Text>
                                {selectedStages.length > 0 ? (
                                    selectedStages.map((stage, index) => {
                                        const faseDetalle = detalleAcondicionamiento.find(d => Number(d.fase) === stage.id);
                                        const isEditable = faseDetalle ? Boolean(Number(faseDetalle.editable)) : true;
                                        return (
                                            <div
                                                key={stage.id}
                                                draggable={canEdit} // permitir arrastrar todos si se puede editar
                                                onDragStart={e => {
                                                    if (canEdit) handleDragStart(e, index);
                                                }}
                                                onDragOver={e => {
                                                    if (canEdit) handleDragOver(e);
                                                }}
                                                onDrop={e => {
                                                    if (canEdit) handleDrop(e, index);
                                                }}
                                                className={`flex items-center rounded-full px-3 py-1 text-sm transition-all mb-2 ${isEditable && canEdit
                                                    ? "bg-gray-100 text-gray-800 hover:bg-red-400 hover:text-white cursor-move"
                                                    : "bg-gray-200 text-gray-500"
                                                    }`}
                                                onClick={() => {
                                                    if (canEdit && isEditable) handleRemoveStage(stage);
                                                }}
                                                style={{ userSelect: "none" }}
                                            >
                                                <span className="mr-2 cursor-move">☰</span>
                                                {stage.description}
                                                {(isEditable && canEdit) && <X className="w-4 h-4 ml-2" />}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-gray-400 text-sm text-center mt-4">No hay fases seleccionadas</p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 mt-2">
                            {/* Tiempo estimado por sistema */}
                            <div className="w-full md:w-1/2">
                                <Text type="subtitle" color="#000">Tiempo Estimado Sistema
                                    <InfoPopover
                                        content={
                                            <>
                                                Este es el tiempo calculado automáticamente por el <strong>sistema</strong> según la duración proporcionada por el usuario y las actividades seleccionadas.
                                            </>
                                        }
                                    />
                                </Text>
                                <div className="mt-2 relative">
                                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        readOnly
                                        className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-sm text-gray-700"
                                        value={`${duration} min ---> ${getFormattedDuration(Number(duration))}`}
                                        disabled={!canEdit}
                                    />
                                </div>
                            </div>

                            {/* Tiempo estimado por usuario */}
                            <div className="w-full md:w-1/2">
                                <Text type="subtitle" color="#000">Tiempo Por Usuario
                                    <InfoPopover
                                        content={
                                            <>
                                                Este es el tiempo calculado automáticamente por el <strong>usuario</strong> según la duración proporcionada a las actividades seleccionadas.
                                            </>
                                        }
                                    />
                                </Text>
                                <div className="mt-2 relative">
                                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        readOnly
                                        className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-sm text-gray-700"
                                        value={`${durationUser} min ---> ${getFormattedDuration(Number(durationUser))}`}
                                        disabled={!canEdit}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <hr className="my-4 border-t border-gray-600 w-full max-w-lg mx-auto opacity-60" />
                    <div className="flex justify-center gap-4 mt-6">
                        <div className="flex gap-2">
                            <Button onClick={() => setIsOpen(false)} variant="cancel" label="Cancelar" />

                            {canEdit && (
                                <>
                                    {!(editingMaestra && editingMaestra.status_type === "Aprobada") && (
                                        <Button
                                            onClick={async () => {
                                                const payload = {
                                                    descripcion,
                                                    requiere_bom: requiereBOM,
                                                    type_product: tipoSeleccionado,
                                                    ...(tipoSeleccionadoAcon != null && {
                                                        type_acondicionamiento: tipoSeleccionadoAcon,
                                                    }),
                                                    type_stage: selectedStages.map((s) => s.id),
                                                    status_type: "Aprobada",
                                                    aprobado: true,
                                                    paralelo,
                                                    duration,
                                                    duration_user: durationUser,
                                                };

                                                if (isSaving) return;
                                                setIsSaving(true);
                                                try {
                                                    if (editingMaestra) {
                                                        await updateMaestra(editingMaestra.id, payload);
                                                    } else {
                                                        await createMaestra(payload);
                                                    }
                                                    showSuccess(editingMaestra ? "Maestra actualizada con éxito" : "Maestra creada con éxito");
                                                    setIsOpen(false);
                                                    resetForm();
                                                    fetchMaestra();
                                                } catch (error) {
                                                    showError("Ocurrió un error al guardar la maestra. Por favor intenta nuevamente.");
                                                    console.error("Error al guardar maestra:", error);
                                                } finally {
                                                    setIsSaving(false);
                                                }
                                            }}
                                            variant="terciario"
                                            disabled={isSaving}
                                            label={
                                                editingMaestra
                                                    ? "Finalizar Edición"
                                                    : isSaving
                                                        ? "Guardando..."
                                                        : "Finalizar"
                                            }
                                        />
                                    )}

                                    <Button
                                        onClick={() => {
                                            setEstado("En creación");
                                            setAprobado(false);
                                            if (editingMaestra) {
                                                handleUpdate();
                                            } else {
                                                handleSubmit();
                                            }
                                        }}
                                        variant="create"
                                        disabled={isSaving}
                                        label={editingMaestra ? "Guardar Cambios" : isSaving ? "Guardando..." : "Crear Maestra"}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </ModalSection>
            )}

            {/* Tabla de maestras */}
            <Table
                columns={["descripcion", "status_type", "aprobado", "paralelo"]}
                rows={maestra}
                columnLabels={{
                    descripcion: "Descripción",
                    status_type: "Estado",
                    aprobado: "Aprobado",
                    paralelo: "Paralelo",
                }}
                onDelete={canEdit ? handleDelete : undefined}
                onEdit={handleEdit}
                onHistory={handleHistory}
            />
            {auditList.length > 0 && (
                <AuditModal audit={auditList} onClose={() => setAuditList([])} />
            )}
        </div >
    );
};

export default Maestra;