
"use client";
import { useState, useEffect } from "react";
import { createFactory, getFactory, deleteFactory, getFactoryId, updateFactory } from "../../services/userDash/factoryServices";
import Table from "../table/Table";
import { showSuccess, showError, showConfirm } from "../toastr/Toaster";
import Button from "../buttons/buttons";
import Text from "../text/Text";
import { motion } from "framer-motion";
import { Factory } from "../../interfaces/NewFactory"

function CreateFactory() {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [name, setName] = useState<string>('');
    const [prefix, setPrefix] = useState<string>('');
    const [location, setLocation] = useState<string>('');
    const [capacity, setCapacity] = useState<string>('');
    const [manager, setManager] = useState<string>('');
    const [employees, setEmployees] = useState<string>('');
    const [status, setStatus] = useState<boolean>(false);
    const [factories, setFactories] = useState<Factory[]>([]);
    const [editingFactory, setEditingFactory] = useState<Factory | null>(null);

    const fetchFactories = async () => {
        try {
            const data: Factory[] = await getFactory();
            setFactories(data);
        } catch (error) {
            console.error("Error fetching factories:", error);
        }
    };

    useEffect(() => {
        fetchFactories();
    }, []);

    const resetForm = () => {
        setName('');
        setPrefix('');
        setLocation('');
        setCapacity('');
        setManager('');
        setEmployees('');
        setStatus(false);
        setEditingFactory(null);
    };

    const handleSave = async () => {
        if (!name || !location || !capacity || !manager || !employees) {
            showError("Por favor, completa todos los campos antes de continuar.");
            return;
        }
        const factoryData = { name, location, capacity, manager, employees, status, prefix }; 
        try {
            if (editingFactory) {
                await updateFactory(editingFactory.id, factoryData);
                showSuccess("Planta actualizada exitosamente");
            } else {
                await createFactory(factoryData);
                showSuccess("Planta creada exitosamente");
            }
            fetchFactories();
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            showError("Error al guardar la planta");
        }
    };

    const handleDelete = async (id: number) => {
        showConfirm("¿Seguro que quieres eliminar esta planta?", async () => {
            try {
                await deleteFactory(id);
                setFactories((prevFactories) => prevFactories.filter((factory) => factory.id !== id));
                showSuccess("Planta eliminada con éxito");
            } catch (error) {
                showError("Error al eliminar la planta");
            }
        });
    };

    const handleEdit = async (id: number) => {
        try {
            const factoryData = await getFactoryId(id);
            setEditingFactory(factoryData);
            setName(factoryData.name);
            setPrefix(factoryData.prefix);
            setLocation(factoryData.location);
            setCapacity(factoryData.capacity);
            setManager(factoryData.manager);
            setEmployees(factoryData.employees);
            setStatus(factoryData.status);
            setIsModalOpen(true);
        } catch (error) {
            showError("Error obteniendo datos de la planta");
        }
    };

    return (
        <div>
            <div className="flex justify-center mb-2">
                <Button onClick={() => {
                    setIsModalOpen(true);
                    resetForm();
                }} variant="create" label="Crear Planta" />
            </div>

            {isModalOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-white rounded-lg shadow-xl w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-[900px] max-h-[90vh] overflow-y-auto p-4 sm:p-6"
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="text-center">
                            <Text type="title">{editingFactory ? "Editar" : "Crear"} Planta</Text>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center mt-4">
                            <div>
                                <Text type="subtitle">Nombre</Text>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full text-black p-2 border mb-2 text-center"
                                />
                            </div>
                            <div>
                                <Text type="subtitle">Prefijo</Text>
                                <input
                                    type="text"
                                    value={prefix}
                                    onChange={(e) => setPrefix(e.target.value)}
                                    className="w-full text-black p-2 border mb-2 text-center"
                                />
                            </div>
                            <div>
                                <Text type="subtitle">Ubicación</Text>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full text-black p-2 border mb-2 text-center"
                                />
                            </div>
                            <div>
                                <Text type="subtitle">Capacidad</Text>
                                <input
                                    type="text"
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                    className="w-full text-black p-2 border mb-2 text-center"
                                />
                            </div>
                            <div>
                                <Text type="subtitle">Persona a Cargo</Text>
                                <input
                                    type="text"
                                    value={manager}
                                    onChange={(e) => setManager(e.target.value)}
                                    className="w-full text-black p-2 border mb-2 text-center"
                                />
                            </div>
                            <div>
                                <Text type="subtitle">Empleados</Text>
                                <input
                                    type="number"
                                    value={employees}
                                    onChange={(e) => setEmployees(e.target.value)}
                                    className="w-full text-black p-2 border mb-2 text-center"
                                />
                            </div>
                            <div>
                                <Text type="subtitle">Estado</Text>
                                <select
                                    value={status ? '1' : '0'}  // Convierte el booleano a '1' o '0'
                                    onChange={(e) => setStatus(e.target.value === '1')}  // Convierte '1' a true y '0' a false
                                    className="w-full p-2 border text-black text-center"
                                >
                                    <option value="">Seleccione un estado</option>
                                    <option value="1">Activo</option>
                                    <option value="0">Inactivo</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-center gap-2 mt-4">
                            <Button onClick={() => setIsModalOpen(false)} variant="cancel" />
                            <Button onClick={handleSave} variant="save" label={editingFactory ? "Actualizar" : "Guardar"} />
                        </div>
                    </motion.div>
                </motion.div>
            )}
            <Table columns={["name", "prefix", "location", "manager", "status"
            ]} rows={factories} columnLabels={{
                name: "Nombre de Planta",
                prefix: "Prefijo",
                location: "Ubicación",
                manager: "Persona a Cargo",
                status: "Estado",
            }} onDelete={handleDelete} onEdit={handleEdit} />
        </div>
    );
}

export default CreateFactory;