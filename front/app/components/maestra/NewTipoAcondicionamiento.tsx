"use client"
// importaciones de react y framer motion
import { useEffect, useState } from "react";
// importaciones de componentes
import Table from "../table/Table";
import Button from "../buttons/buttons";
import Text from "../text/Text";
import ModalSection from "../modal/ModalSection";
import { showError, showConfirm } from "../toastr/Toaster";
// importaciones de interfaces
import { TipoAcondicionamiento, DataTipoAcondicionamiento, LineaTipoAcondicionamiento, DataLineaTipoAcondicionamiento } from "@/app/interfaces/NewTipoAcondicionamiento";
// importaciones de interfaces
import { Stage } from "@/app/interfaces/NewStage";
// importaciones de servicios
import { createStage as createTipoAcom, getStage as listTipoAcondicionamiento, deleteStage as deleteTipoAcom, updateTipoAcondicionamiento as updateTipoAcom } from "@/app/services/maestras/TipoAcondicionamientoService";
import { createStage as createLineaTipoAcom, getStage as listLineaTipoAcondicionamiento, deleteStage as deleteLineaTipoAcom, updateLineaTipoAcondicionamiento as updateLineaTipoAcom, getLineaTipoAcondicionamientoById as getLineaTipoAcomById, getListTipoyLineas as getListTipoyLineas, getSelectStagesControls as getSelectStagesControls } from "@/app/services/maestras/LineaTipoAcondicionamientoService";
import { getStageId } from "@/app/services/maestras/stageServices";

// función principal del componente
export default function NewTipoAcondicionamiento() {
    // variables de estado
    const [isOpen, setIsOpen] = useState(false);
    const [isOpenEdit, setIsOpenEdit] = useState(false);
    const [btnAplicar, setBtnAplicar] = useState(false);
    const [objectTipoAcom, setObjectTipoAcom] = useState<TipoAcondicionamiento>({
        id: 0,
        descripcion: "",
        status: false
    });
    const [unknown, setObjectLineaTipoAcom] = useState<LineaTipoAcondicionamiento>({
        id: 0,
        tipo_acondicionamiento_id: 0,
        orden: 0,
        descripcion: "",
        fase: "",
        descripcion_fase: "",
        editable: false,
        control: false,
        fase_control: "",
        descripcion_fase_control: ""
    });
    const [listTipoAcom, setListTipoAcom] = useState<DataTipoAcondicionamiento[]>([]);
    const [listLinaTipoAcom, setLineaTipoAcom] = useState<DataLineaTipoAcondicionamiento[]>([]);
    const [listStages, setListStages] = useState<Stage[]>([]);
    const [listStagesControls, setListStagesControls] = useState<Stage[]>([]);

    // Captura de los datos del tipo de acondicionamiento
    const inputChangeObjectTipoAcom = (e: React.ChangeEvent<HTMLInputElement>) => {
        setObjectTipoAcom({
            ...objectTipoAcom,
            status: true,
            [e.target.name]: e.target.value
        });
    }
    const getStageId = (id: string | number) =>
        listStages.find((item) => item.id === id);

    // captura de los datos de la linea tipo de acondicionamiento
    const inputChangeObjectLineaTipoAcom = (e: React.ChangeEvent<HTMLInputElement>) => {
        setObjectLineaTipoAcom({
            ...unknown,
            [e.target.name]: e.target.value
        });
    }

    // captura de los datos de la linea tipo de acondicionamiento
    const inputCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setObjectLineaTipoAcom((prev) => ({
            ...prev,
            [e.target.name]: e.target.checked
        }));
    }

    // función para crear un tipo de acondicionamiento
    const handleBtnAplicar = async () => {
        const response = await createTipoAcom(objectTipoAcom);
        if (response.status === 201) {

            // Actualiza el estado correctamente
            setObjectLineaTipoAcom(prev => ({
                ...prev,
                tipo_acondicionamiento_id: Number(response.id)
            }));

            // Cambiar estado y obtener la lista de tipos de acondicionamiento
            setBtnAplicar(!btnAplicar);
            await getListTipoAcom();
        }
    }

    // función para crear una linea tipo de acondicionamiento
    const handleBtnAgregarLinea = async () => {
        const response = await createLineaTipoAcom(unknown);
        if (response.status === 201) {

            // resetear los datos de la linea tipo de acondicionamiento
            setObjectLineaTipoAcom((prev) => ({
                ...prev,
                id: 0,
                tipo_acondicionamiento_id: unknown.tipo_acondicionamiento_id,
                orden: 0,
                descripcion: "",
                fase: "",
                editable: false,
                control: false,
                fase_control: "",
                descripcion_fase_control: "",
            }));

            // Cambiar estado y obtener la lista de tipos de acondicionamiento
            await getListLineaTipoAcom();
        }
    }

    // función para eliminar un tipo de acondicionamiento
    const handleDelete = async (id: number) => {
        showConfirm("¿Seguro que quieres eliminar esta fase?", async () => {
            try {
                await deleteTipoAcom(id);
            } catch (error) {
                console.error("Error al eliminar fase:", error);
                showError("Error al eliminar fase");
            }
        });
        await getListTipoAcom();
    }

    const handleDeleteLinea = async (id: number) => {
        await deleteLineaTipoAcom(id);
        await getListLineaTipoAcom();
    }

    const handleBtnAplicarEdit = async () => {
        await updateTipoAcom(objectTipoAcom.id, objectTipoAcom);
        await getListTipoAcom();
    }

    // función para abrir el modal de edición
    const handleOpenEdit = async (id: number) => {
        await getListTipoAcomyLineas(id);
    }

    // función para listar los tipos de acondicionamiento
    const getListTipoAcom = async () => {
        const response = await listTipoAcondicionamiento();
        setListTipoAcom(response);
    }

    // función para listar las lineas de tipo de acondicionamiento
    const getListLineaTipoAcom = async () => {
        const response = await getLineaTipoAcomById(unknown.tipo_acondicionamiento_id);
        setLineaTipoAcom(response);
    }

    // función para listar los tipos de acondicionamiento y las lineas de tipo de acondicionamiento
    const getListTipoAcomyLineas = async (id: number) => {
        const response = await getListTipoyLineas(id);
        setObjectTipoAcom(response.tipos);
        setObjectLineaTipoAcom((prev) => ({
            ...prev,
            id: 0,
            tipo_acondicionamiento_id: response.tipos.id,
            orden: 0,
            descripcion: "",
            fase: "",
            editable: false,
            control: false,
            fase_control: "",
            descripcion_fase_control: "",
        }));
        setLineaTipoAcom(response.lineas);
        setIsOpenEdit(true);
    };

    // función para obtener las fases y los controles
    const getSelectStages = async () => {
        const response = await getSelectStagesControls();
        setListStages(response.fases);
        setListStagesControls(response.controles);
    }

    // función para resetear los datos
    const handleReset = () => {
        setIsOpen(false);
        setIsOpenEdit(false);
        setBtnAplicar(false);

        // resetear los datos del tipo de acondicionamiento
        setObjectTipoAcom((prev) => ({
            ...prev,
            id: 0,
            descripcion: "",
            status: false
        }));

        // resetear los datos de la linea tipo de acondicionamiento
        setObjectLineaTipoAcom((prev) => ({
            ...prev,
            id: 0,
            tipo_acondicionamiento_id: 0,
            orden: 0,
            descripcion: "",
            fase: "",
            editable: false,
            control: false,
            fase_control: "",
            descripcion_fase_control: "",
        }));

        // renderizar la lista de tipos de acondicionamiento
        setLineaTipoAcom([]);
    }

    // Instancia del componente
    useEffect(() => {
        // listar los tipos de acondicionamiento
        getListTipoAcom();
        getListLineaTipoAcom();
        getSelectStages();
    }, []);

    // Cambio de estado del checkbox control
    useEffect(() => {
        setObjectLineaTipoAcom((prev) => ({
            ...prev,
            fase_control: prev.control ?
                prev.fase_control : ""
        }));
    }, [unknown.control]);

    // Renderización del componente
    return (
        <>
            {/* Bloque del componente 1 */}
            <div className="flex justify-center space-x-2 mb-2">
                <Button onClick={() => setIsOpen(true)} variant="create" label="Crear" /></div>
            <div>
                {/* Botón abrir modal de creación */}

                {/* Tabla de tipos de acondicionamiento */}
                <Table columns={["descripcion", "status"]} rows={listTipoAcom}
                    columnLabels={{ 
                        descripcion: "Descripción",
                        status: "Estado",
                    }} onDelete={handleDelete} onEdit={handleOpenEdit} />
            </div>

            {/* Bloque del componente 2 */}
            <div>
                {/* Modal de creación y edición */}
                {(isOpen || isOpenEdit) && (
                    <ModalSection isVisible={isOpen || isOpenEdit} onClose={() => {
                        if (isOpenEdit) {
                            handleReset();
                        } else {
                            setIsOpen(false);
                        }
                        setIsOpenEdit(false);
                    }} >
                        {/* Título */}
                        <Text type="title" >{isOpenEdit ? "Editar Tipo de Orden de Acondicionamiento" : "Crear Nuevo Tipo de Acondicionamiento"}</Text>
                        {/* Formulario principal */}
                        <div className="mb-8">
                            <Text type="subtitle">Descripción</Text>
                            <input
                                id="descripcion"
                                type="text"
                                name="descripcion"
                                value={objectTipoAcom.descripcion}
                                onChange={(e) => inputChangeObjectTipoAcom(e)}
                                disabled={btnAplicar}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 text-center"
                                placeholder="Ejemplo: Revisión técnica"
                            />
                        </div>

                        {/* Tabla y formulario dinámico (solo si se aplicó el tipo base) */}
                        {(btnAplicar || isOpenEdit) && (
                            <>
                                <Text type="title" >Líneas de Acondicionamiento</Text>
                                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-200 text-gray-700 text-center">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600">Orden</th>
                                                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600">Descripción</th>
                                                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600">Fase</th>
                                                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600">Editable</th>
                                                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600">Control</th>
                                                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600">Fase Control</th>
                                                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-600">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {listLinaTipoAcom.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3">{item.orden}</td>
                                                    <td className="px-4 py-3">{item.descripcion}</td>
                                                    <td className="px-4 py-3">{item.descripcion_fase}</td>
                                                    <td className="px-4 py-3">{item.editable ? "Sí" : "No"}</td>
                                                    <td className="px-4 py-3">{item.control ? "Sí" : "No"}</td> 
                                                    <td className="px-4 py-3">{item.descripcion_fase_control || "-"}</td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() => handleDeleteLinea(item.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                            title="Eliminar línea"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}

                                            {/* Fila de formulario */}
                                            <tr className="bg-white">
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-center items-center">
                                                        <input
                                                            type="number"
                                                            name="orden"
                                                            min="1"
                                                            value={unknown.orden === 0 ? "" : unknown.orden}
                                                            onChange={(e) => {
                                                                const newOrden = parseInt(e.target.value);
                                                                const isDuplicate = listLinaTipoAcom.some(
                                                                    (item) =>
                                                                        item.orden === newOrden && item.id !== unknown.id
                                                                );
                                                                if (isDuplicate) {
                                                                    alert(`Ya existe una línea con orden ${newOrden}`);
                                                                    return;
                                                                }
                                                                inputChangeObjectLineaTipoAcom(e);
                                                            }}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        name="descripcion"
                                                        value={unknown.descripcion}
                                                        onChange={inputChangeObjectLineaTipoAcom}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-center items-center">
                                                        <select
                                                            name="fase"
                                                            value={unknown.fase}
                                                            onChange={(e) =>
                                                                setObjectLineaTipoAcom({
                                                                    ...unknown,
                                                                    fase: e.target.value,
                                                                })
                                                            }
                                                            className="w-full px-3 py-2 border flex justify-center items-center border-gray-300 rounded-md text-center text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            <option value="">Seleccione una fase</option>
                                                            {/* Mostrar la opción seleccionada al editar si ya está asignada */}
                                                            {unknown.fase &&
                                                                !listStages.find((item) => item.id === Number(unknown.fase)) && (
                                                                    <option value={unknown.fase}>
                                                                        {
                                                                            getStageId(unknown.fase)?.description ||
                                                                            'Fase desconocida'
                                                                        }
                                                                    </option>
                                                                )}
                                                            {listStages
                                                                .filter((item) => item.phase_type !== 'Control')
                                                                .map((item) => (
                                                                    <option key={item.id} value={item.id}>
                                                                        {item.description}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-center items-center">
                                                        <label className="inline-flex items-center justify-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                name="editable"
                                                                checked={unknown.editable}
                                                                onChange={inputCheckboxChange}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                        </label>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-center items-center">
                                                        <label className="inline-flex items-center justify-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                name="control"
                                                                checked={unknown.control}
                                                                onChange={inputCheckboxChange}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                        </label>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-center items-center">
                                                        {unknown.control && (
                                                            <select
                                                                name="fase_control"
                                                                value={unknown.fase_control}
                                                                onChange={(e) =>
                                                                    setObjectLineaTipoAcom({ ...unknown, fase_control: e.target.value })
                                                                }
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            >
                                                                <option value="">Seleccione una fase control</option>
                                                                {listStagesControls.map((item) => (
                                                                    <option key={item.id} value={item.id}>
                                                                        {item.description}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-center items-center">
                                                        <Button onClick={handleBtnAgregarLinea} variant="create" label="" />
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                            </>
                        )}

                        {/* Acciones finales */}
                        <div className="flex justify-center space-x-4 mt-4">
                            <Button onClick={() => { handleReset(); }} variant="cancel" label={"Cerrar"} />
                            {!btnAplicar && (
                                <Button onClick={() => { (isOpenEdit ? handleBtnAplicarEdit() : handleBtnAplicar()) }} variant="create" label={isOpenEdit ? "Actualizar" : "Aplicar"} />
                            )}
                        </div>
                    </ModalSection>
                )}
            </div>
        </>
    )
}
