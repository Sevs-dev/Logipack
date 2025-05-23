"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createManu, getManu, getManuId, updateManu, deleteManu } from "../../services/userDash/manufacturingServices";
import { getProduct } from "../../services/userDash/productServices";
import { getFactory, getFactoryId } from "../../services/userDash/factoryServices";
import Table from "../table/Table";
import { showSuccess, showError, showConfirm } from "../toastr/Toaster";
import Button from "../buttons/buttons";
import Text from "../text/Text";
interface Manu {
    id?: number;
    name: string;
    line_types: string[];
    factory_id: number;
}

interface Factory {
    id: number;
    name: string;
}

function CreateManufacturing() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Manu>({ name: "", line_types: [], factory_id: 0 });
    const [factories, setFactories] = useState<{ id: number; name: string }[]>([]);
    const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
    const [manu, setManu] = useState<Manu[]>([]);

    const columnLabels = { name: "Nombre", factory: "Fábrica" };
    const columns = ["name", "factory"];

    // Función para obtener los datos
    const fetchData = async () => {
        try {
            const [productsResponse, manuResponse, factoriesResponse] = await Promise.all([
                getProduct(),
                getManu(),
                getFactory()
            ]);

            const manuWithFactoryNames = manuResponse.map((manu: Manu) => {
                const factory = factoriesResponse.find((f: Factory) => f.id === manu.factory_id);
                return { ...manu, factory: factory ? factory.name : "Sin fábrica" };
            });

            setProducts(productsResponse);
            setManu(manuWithFactoryNames);
            setFactories(factoriesResponse);
        } catch (error) {
            console.error("Error al obtener datos:", error);
            showError("No se pudieron cargar los datos");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "factory_id" ? Number(value) : value
        }));
    };

    const handleSelectChange = (name: string) => {
        setFormData(prev => ({
            ...prev,
            line_types: prev.line_types.includes(name)
                ? prev.line_types.filter(item => item !== name)
                : [...prev.line_types, name]
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Validación para campos vacíos
        if (!formData.name || !formData.factory_id || formData.line_types.length === 0) {
            showError("Por favor, completa todos los campos antes de guardar.");
            return;
        }
        try {
            if (formData.id) {
                await updateManu(formData.id, formData);
                showSuccess("Manufactura actualizada correctamente");
            } else {
                await createManu(formData);
                showSuccess("Manufactura creada correctamente");
            }
            await fetchData(); // Actualizar la tabla después de crear o editar
            closeModal();
        } catch (error) {
            console.error("Error al guardar manufactura", error);
            showError("No se pudo guardar la manufactura");
        }
    };

    const handleDelete = async (id: number) => {
        showConfirm("¿Estás seguro de eliminar esta manufactura?", async () => {
            try {
                await deleteManu(id);
                setManu(prev => prev.filter(m => m.id !== id));
                showSuccess("Manufactura eliminada correctamente");
            } catch (error) {
                console.error("Error al eliminar manufactura", error);
                showError("No se pudo eliminar la manufactura");
            }
        });
    };

    const openModal = () => {
        setIsModalOpen(true);
        setFormData({ name: "", line_types: [], factory_id: 0 });
    };

    const openEditModal = async (id: number) => {
        try {
            const data = await getManuId(id);
            if (!data) return showError("No se encontraron datos para esta manufactura.");

            // Obtener detalles de la fábrica asociada
            const factoryData = await getFactoryId(data.factory_id);

            setFormData({
                ...data,
                factory_id: factoryData?.id || "", // Asignar ID de la fábrica
                line_types: Array.isArray(data.line_types) ? data.line_types : JSON.parse(data.line_types)
            });
            setIsModalOpen(true);
        } catch (error) {
            console.error("Error al obtener los datos de la manufactura:", error);
            showError("No se pudieron cargar los datos de la manufactura.");
        }
    };


    const closeModal = () => setIsModalOpen(false);

    return (
        <div>
            <div className="flex justify-center mb-2">
                <Button onClick={openModal} variant="create" label="Crear Linea" />
            </div>
            {isModalOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-[100%] md:max-w-[600px] max-h-[90vh] overflow-y-auto z-50"
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                    >
                        <Text type="title">{formData.id ? "Editar" : "Crear"} Línea</Text>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <Text type="subtitle">Nombre de Línea</Text>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Nombre"
                                    className="w-full text-black border p-2 mb-3"
                                />
                            </div>
                            <div className="mb-4">
                                <Text type="subtitle">Seleccionar Fábrica</Text>
                                <select
                                    name="factory_id"
                                    value={formData.factory_id || ""}
                                    onChange={(e) => setFormData({ ...formData, factory_id: Number(e.target.value) })}
                                    className="w-full text-black border p-2 mb-3"
                                >
                                    <option value="">Seleccionar...</option>
                                    {factories.map(factory => (
                                        <option key={factory.id} value={factory.id}>
                                            {factory.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <div className="flex gap-4">
                                    <div className="w-1/2 border p-2 h-80 overflow-y-auto">
                                        <Text type="subtitle">Tipo de Productos Disponibles</Text>
                                        {products
                                            .filter(product => !formData.line_types.includes(product.name)) 
                                            .map(product => (
                                                <div
                                                    key={product.id}
                                                    className="cursor-pointer text-black p-1 hover:bg-gray-200"
                                                    onClick={() => handleSelectChange(product.name)}
                                                >
                                                    {product.name}
                                                </div>
                                            ))}
                                    </div>
                                    <div className="w-1/2 border p-2 h-80 overflow-y-auto">
                                        <Text type="subtitle">Tipos Seleccionados</Text>
                                        {formData.line_types.map((item, index) => (
                                            <div
                                                key={index}
                                                className="cursor-pointer p-1 text-black bg-blue-200 hover:bg-red-200"
                                                onClick={() => handleSelectChange(item)}
                                            >
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-center gap-2 mt-2">
                                <Button onClick={closeModal} variant="cancel" />
                                <Button type="submit" variant="save" />
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
            <Table columns={columns} rows={manu} columnLabels={columnLabels} onDelete={handleDelete} onEdit={openEditModal} />
        </div>
    );
}

export default CreateManufacturing;
