"use client"

// importaciones de react y framer motion
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// importaciones de componentes
import Table from "../table/Table";
import Button from "../buttons/buttons";
import Text from "../text/Text";

// importaciones de interfaces
import {
    TipoAcondicionamiento, DataTipoAcondicionamiento,
    LineaTipoAcondicionamiento, DataLineaTipoAcondicionamiento
} from "@/app/interfaces/NewTipoAcondicionamiento";

// importaciones de interfaces
import {
    Stage
} from "@/app/interfaces/NewStage";

// importaciones de servicios
import {
    createStage as createTipoAcom,
    getStage as listTipoAcondicionamiento,
    deleteStage as deleteTipoAcom,
    updateTipoAcondicionamiento as updateTipoAcom
} from "@/app/services/maestras/TipoAcondicionamientoService";

import {
    createStage as createLineaTipoAcom,
    getStage as listLineaTipoAcondicionamiento,
    deleteStage as deleteLineaTipoAcom,
    updateLineaTipoAcondicionamiento as updateLineaTipoAcom,
    getLineaTipoAcondicionamientoById as getLineaTipoAcomById,
    getListTipoyLineas as getListTipoyLineas,
    getSelectStagesControls as getSelectStagesControls
} from "@/app/services/maestras/LineaTipoAcondicionamientoService";


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
    const [objectLineaTipoAcom, setObjectLineaTipoAcom] = useState<LineaTipoAcondicionamiento>({
        id: 0,
        tipo_acondicionamiento_id: 0,
        orden: 0,
        descripcion: "",
        fase: "",
        editable: false,
        control: false,
        fase_control: ""
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

    // captura de los datos de la linea tipo de acondicionamiento
    const inputChangeObjectLineaTipoAcom = (e: React.ChangeEvent<HTMLInputElement>) => {
        setObjectLineaTipoAcom({
            ...objectLineaTipoAcom,
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
        const response = await createLineaTipoAcom(objectLineaTipoAcom);
        if (response.status === 201) {

            // resetear los datos de la linea tipo de acondicionamiento
            setObjectLineaTipoAcom((prev) => ({
                ...prev,
                id: 0,
                tipo_acondicionamiento_id: objectLineaTipoAcom.tipo_acondicionamiento_id,
                orden: 0,
                descripcion: "",
                fase: "",
                editable: false,
                control: false,
                fase_control: ""
            }));

            // Cambiar estado y obtener la lista de tipos de acondicionamiento
            await getListLineaTipoAcom();
        }
    }

    // función para eliminar un tipo de acondicionamiento
    const handleDelete = async (id: number) => {
        await deleteTipoAcom(id);
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
        const response = await getLineaTipoAcomById(objectLineaTipoAcom.tipo_acondicionamiento_id);
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
            fase_control: ""
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
            fase_control: ""
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
    }, [objectLineaTipoAcom.control]);

    // Renderización del componente
    return (
        <>
            {/* Bloque del componente 1 */}
            <div>
                {/* Botón abrir modal de creación */}
                <Button onClick={() => setIsOpen(true)}
                    variant="create" label="Crear" />

                {/* Tabla de tipos de acondicionamiento */}
                <Table columns={["id", "descripcion", "status"]} rows={listTipoAcom}
                    columnLabels={{
                        id: "ID",
                        descripcion: "Descripción",
                        status: "Estado",
                    }} onDelete={handleDelete} onEdit={handleOpenEdit} />
            </div>

            {/* Bloque del componente 2 */}
            <div>
                {/* Modal de creación y edición */}
                {(isOpen || isOpenEdit) && (
                    <motion.div
                        className="fixed inset-0 bg-black 
                        bg-opacity-50 flex justify-center items-start p-4 z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}>

                        <motion.div
                            className="mt-20 bg-white rounded-lg shadow-xl 
                            w-full max-w-xl sm:max-w-2xl md:max-w-3xl 
                            lg:max-w-[1800px] max-h-[90vh] 
                            overflow-y-auto p-4 sm:p-6 relative"
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            transition={{ duration: 0.3 }}>

                            {/* Botón de cierre */}
                            <button
                                onClick={() => {
                                    isOpenEdit ? handleReset() :
                                        setIsOpen(false);
                                    setIsOpenEdit(false);
                                }}
                                className="absolute top-3 right-3 text-gray-700 hover:text-gray-900 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Título */}
                            <Text type="title">
                                {isOpenEdit ? (
                                    "Editar Tipo de Ordenes de Acondicionamiento"
                                ) : (
                                    <>
                                        <p>Crear</p>
                                        <p>Tipo Acondicionamiento</p>
                                    </>
                                )}
                            </Text>


                            {/* Contenedor para formulario tipo de acondicionamiento */}
                            <div className="flex justify-center gap-8 mt-6 flex-wrap" >

                                {/* Grupo 1: Formulario */}
                                <div className="w-full lg:w-1/2 max-w-[600px] space-y-4 border-b pb-6">
                                    <Text type="subtitle">Descripción</Text>
                                    <input type="text"
                                        value={objectTipoAcom.descripcion}
                                        onChange={(e) => inputChangeObjectTipoAcom(e)}
                                        name="descripcion"
                                        disabled={btnAplicar}
                                        className="mt-1 w-full text-center p-2 border 
                                        border-gray-300 rounded-lg focus:outline-none 
                                        focus:ring-2 focus:ring-blue-400 text-black"
                                    />

                                    {/* Botón para aplicar los cambios */}
                                    {!btnAplicar && (
                                        <div className="flex justify-center">
                                            <Button
                                                onClick={() => {
                                                    isOpenEdit ? handleBtnAplicarEdit() : handleBtnAplicar();
                                                }}
                                                variant="save"
                                                // disabled={!object.descripcion.trim()}
                                                label={isOpenEdit ? "Actualizar" : "Aplicar"} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Grupo 2: Tabla y botones */}
                            {(btnAplicar || isOpenEdit) && (
                                <div className="mt-6 space-y-4">
                                    <div>
                                        <table className="w-full text-sm text-left rtl:text-right 
                                        text-gray-500 dark:text-gray-400">
                                            <thead className="text-xs text-gray-700 uppercase 
                                            bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                                <tr style={{ textAlign: "center", fontSize: "18px", height: "50px" }}>
                                                    <th>Orden</th>
                                                    <th>Descripción</th>
                                                    <th>Fase</th>
                                                    <th>Es Editable</th>
                                                    <th>Control</th>
                                                    <th>Fase Control</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody style={{ textAlign: "center", fontSize: "18px" }}>
                                                {listLinaTipoAcom.map((item) => (
                                                    <tr key={item.id}>
                                                        <td>{item.orden}</td>
                                                        <td>{item.descripcion}</td>
                                                        <td>{item.fase}</td>
                                                        <td>{item.editable ? "Si" : "No"}</td>
                                                        <td>{item.control ? "Si" : "No"}</td>
                                                        <td>{item.fase_control}</td>
                                                        <td>
                                                            <div style={{ display: "flex", justifyContent: "center" }}>
                                                                <Button
                                                                    onClick={() => handleDeleteLinea(item.id)}
                                                                    variant="cancel" label="" />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}

                                                {/* Formulario para agregar una linea tipo de acondicionamiento */}
                                                <tr>
                                                    <td>
                                                        <input type="number" name="orden"
                                                            onChange={(e) => inputChangeObjectLineaTipoAcom(e)}
                                                            value={
                                                                objectLineaTipoAcom.orden === 0 ?
                                                                    "" : objectLineaTipoAcom.orden
                                                            }
                                                            className="mt-1 w-full text-center p-2 border 
                                                            border-gray-300 rounded-lg focus:outline-none 
                                                            focus:ring-2 focus:ring-blue-400 text-black" />
                                                    </td>
                                                    <td>
                                                        <input type="text" name="descripcion"
                                                            onChange={(e) => inputChangeObjectLineaTipoAcom(e)}
                                                            value={objectLineaTipoAcom.descripcion}
                                                            className="mt-1 w-full text-center p-2 border 
                                                            border-gray-300 rounded-lg focus:outline-none 
                                                            focus:ring-2 focus:ring-blue-400 text-black" />
                                                    </td>
                                                    <td>
                                                        <select name="fase"
                                                            onChange={(e) => {
                                                                setObjectLineaTipoAcom({
                                                                    ...objectLineaTipoAcom,
                                                                    fase: e.target.value
                                                                });
                                                            }}
                                                            value={objectLineaTipoAcom.fase}
                                                            className="mt-1 w-full text-center p-2 border 
                                                            border-gray-300 rounded-lg focus:outline-none 
                                                            focus:ring-2 focus:ring-blue-400 text-black">
                                                            <option value="">Seleccione una fase</option>
                                                            {listStages.map((item) => (
                                                                <option value={item.id}>{item.description}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input type="checkbox" name="editable"
                                                            checked={objectLineaTipoAcom.editable}
                                                            onChange={(e) => inputCheckboxChange(e)}
                                                            className="mt-1 h-6 w-6 cursor-pointer appearance-none rounded-md border-2 
                                                            border-gray-300 bg-white checked:border-blue-500 checked:bg-blue-500 
                                                            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 
                                                            transition-all duration-200 ease-in-out" />
                                                    </td>
                                                    <td>
                                                        <input type="checkbox" name="control"
                                                            checked={objectLineaTipoAcom.control}
                                                            onChange={(e) => inputCheckboxChange(e)}
                                                            className="mt-1 h-6 w-6 cursor-pointer appearance-none rounded-md border-2 
                                                            border-gray-300 bg-white checked:border-blue-500 checked:bg-blue-500 
                                                            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 
                                                            transition-all duration-200 ease-in-out" />
                                                    </td>
                                                    <td>
                                                        {objectLineaTipoAcom.control && (

                                                            <select name="fase_control"
                                                                onChange={(e) => {
                                                                    setObjectLineaTipoAcom({
                                                                        ...objectLineaTipoAcom,
                                                                        fase_control: e.target.value
                                                                    });
                                                                }}
                                                                value={objectLineaTipoAcom.fase_control}
                                                                className="mt-1 w-full text-center p-2 border 
                                                                border-gray-300 rounded-lg focus:outline-none 
                                                                focus:ring-2 focus:ring-blue-400 text-black">
                                                                <option value="">Seleccione una fase control</option>
                                                                {listStagesControls.map((item) => (
                                                                    <option value={item.id}>{item.description}</option>
                                                                ))}
                                                            </select>
                                                        )}

                                                    </td>
                                                    <td>
                                                        <div style={{ display: "flex", justifyContent: "center" }}>
                                                            <Button
                                                                onClick={() => handleBtnAgregarLinea()}
                                                                variant="create" label="Agregar" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 flex justify-center gap-2" style={{ marginTop: "100px" }}>
                                {(btnAplicar && listLinaTipoAcom.length > 0 || isOpenEdit) && (
                                    <Button
                                        onClick={() => {
                                            handleReset();
                                        }}
                                        variant="cancel"
                                        // disabled={!object.descripcion.trim()}
                                        label={"Confirmar y limpiar"} />
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </>
    )
}
