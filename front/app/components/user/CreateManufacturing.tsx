"use client";

import { useState, useEffect } from "react";
import { createManu, getManu, getManuId, updateManu, deleteManu } from "../../services/userDash/manufacturingServices";
import ModalSection from "../modal/ModalSection";
import { getProduct } from "../../services/userDash/productServices";
import { getFactory, getFactoryId } from "../../services/userDash/factoryServices";
import Table from "../table/Table";
import { showSuccess, showError, showConfirm } from "../toastr/Toaster";
import Button from "../buttons/buttons";
import Text from "../text/Text";
import { Manu, Factory, Product } from "../../interfaces/Products"

function CreateManufacturing() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Manu>({ name: "", products: [], factory_id: 0 });
    const [factories, setFactories] = useState<Factory[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [manu, setManu] = useState<Manu[]>([]);

    const columnLabels = { name: "Nombre", factory: "Fábrica" };
    const columns = ["name", "factory"];

    const fetchData = async () => {
        try {
            const [productsResponse, manuResponse, factoriesResponse] = await Promise.all([
                getProduct(),
                getManu(),
                getFactory()
            ]);

            const manuWithFactoryNames = manuResponse.map((m: Manu) => {
                const factory = (factoriesResponse as Factory[]).find((f: Factory) => f.id === m.factory_id);
                return { ...m, factory: factory?.name || "Sin fábrica" };
            });

            setProducts(productsResponse);
            setFactories(factoriesResponse);
            setManu(manuWithFactoryNames);
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
        setFormData((prev) => ({
            ...prev,
            [name]: name === "factory_id" ? Number(value) : value
        }));
    };

    const handleSelectChange = (productId: number) => {
        setFormData((prev) => ({
            ...prev,
            products: prev.products.includes(productId)
                ? prev.products.filter((id) => id !== productId)
                : [...prev.products, productId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.factory_id || formData.products.length === 0) {
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
            await fetchData();
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
                setManu((prev) => prev.filter((m) => m.id !== id));
                showSuccess("Manufactura eliminada correctamente");
            } catch (error) {
                console.error("Error al eliminar manufactura", error);
                showError("No se pudo eliminar la manufactura");
            }
        });
    };

    const openModal = () => {
        setIsModalOpen(true);
        setFormData({ name: "", products: [], factory_id: 0 });
    };

    const openEditModal = async (id: number) => {
        try {
            const data = await getManuId(id);
            if (!data) return showError("No se encontraron datos para esta manufactura.");

            setFormData({
                ...data,
                products: Array.isArray(data.products)
                    ? data.products
                    : JSON.parse(data.products)
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
                <Button onClick={openModal} variant="create" label="Crear Línea" />
            </div>

            {isModalOpen && (
                <ModalSection isVisible={isModalOpen} onClose={closeModal}>
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
                                value={formData.factory_id}
                                onChange={handleChange}
                                className="w-full text-black border p-2 mb-3"
                            >
                                <option value="">Seleccionar...</option>
                                {factories.map((factory) => (
                                    <option key={factory.id} value={factory.id}>
                                        {factory.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <div className="flex gap-4">
                                <div className="w-1/2 border p-2 h-80 overflow-y-auto">
                                    <Text type="subtitle">Productos Disponibles</Text>
                                    {products
                                        .filter((product) => !formData.products.includes(product.id))
                                        .map((product) => (
                                            <div
                                                key={product.id}
                                                className="cursor-pointer text-black p-1 hover:bg-gray-200"
                                                onClick={() => handleSelectChange(product.id)}
                                            >
                                                {product.name}
                                            </div>
                                        ))}
                                </div>

                                <div className="w-1/2 border p-2 h-80 overflow-y-auto">
                                    <Text type="subtitle">Productos Seleccionados</Text>
                                    {formData.products.map((productId) => {
                                        const product = products.find((p) => p.id === productId);
                                        return (
                                            <div
                                                key={productId}
                                                className="cursor-pointer p-1 text-black bg-blue-200 hover:bg-red-200"
                                                onClick={() => handleSelectChange(productId)}
                                            >
                                                {product?.name || `Producto ID ${productId}`}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center gap-2 mt-2">
                            <Button onClick={closeModal} variant="cancel" />
                            <Button type="submit" variant="save" />
                        </div>
                    </form>
                </ModalSection>
            )}

            <Table
                columns={columns}
                rows={manu}
                columnLabels={columnLabels}
                onDelete={handleDelete}
                onEdit={openEditModal}
            />
        </div>
    );
}

export default CreateManufacturing;
