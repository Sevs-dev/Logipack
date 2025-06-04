// React y librerías externas
import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
// Componentes locales
import Button from "../buttons/buttons";
import Text from "../text/Text";
import Table from "../table/Table";
import { showSuccess, showError, showConfirm } from "../toastr/Toaster";
import ModalSection from "../modal/ModalSection";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
// Servicios 
import { getClients, getClientsId } from "@/app/services/userDash/clientServices";
import { getArticleByCode, newArticle, getArticlesId, deleteArticle, updateArticle, getBoms } from "@/app/services/bom/articleServices";
// Tipos e interfaces
import { Client, Article, Ingredient, Bom, BomView } from "@/app/interfaces/BOM";

function BOMManager({ canEdit = false, canView = false }: CreateClientProps) {
    // Estados
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentBomId, setCurrentBomId] = useState<number | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>("");
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [loadingArticles, setLoadingArticles] = useState(false);
    const [baseQuantity, setBaseQuantity] = useState(0);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [boms, setBoms] = useState<Bom[]>([]);
    const [bomStatus, setBomStatus] = useState(false); // false = inactivo, true = activo
    const [isSaving, setIsSaving] = useState(false);
    const [allArticles, setAllArticles] = useState<Article[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const filteredArticles = useMemo(() => {
        if (!searchTerm.trim()) return articles;
        return articles.filter(
            article =>
                article.desart.toLowerCase().includes(searchTerm.toLowerCase()) ||
                article.codart.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [articles, searchTerm]);

    // Cargar clientes al montar el componente
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const clientsData = await getClients(); // Obtener todos los clientes desde el servicio
                setClients(clientsData); // Guardar en el estado
            } catch (error) {
                showError("Error al cargar los clientes."); // Mostrar error si falla
                console.error(error);
            }
        };
        fetchClients(); // Ejecutar función al montar
    }, []);

    // Cargar BOMs y asociar nombre del cliente y datos del artículo
    const fetchBOMs = async () => {
        try {
            const data = await getBoms(); // Obtener todos los BOMs
            const bomsData: Bom[] = data.boms;
            // Enriquecer cada BOM con datos del cliente y artículo
            const bomsWithExtra: BomView[] = await Promise.all(
                bomsData.map(async (bom) => {
                    const clientData = await getClientsId(bom.client_id); // Obtener cliente asociado
                    let article_codart = "";
                    let article_desart = "";
                    // Parsear detalles del artículo si existen
                    if (bom.details) {
                        try {
                            const detailsObj = JSON.parse(bom.details);
                            if (detailsObj.article) {
                                article_codart = detailsObj.article.codart || "";
                                article_desart = detailsObj.article.desart || "";
                            }
                        } catch (error) {
                            console.error("Error parseando details:", error); // Error de parseo
                        }
                    }
                    return {
                        ...bom,
                        client_name: clientData.name,
                        article_codart,
                        article_desart,
                    };
                })
            );
            setBoms(bomsWithExtra); // Guardar los BOMs enriquecidos
        } catch (error) {
            showError("Error al cargar los BOMs.");
            console.error(error);
        }
    };

    useEffect(() => {
        if (canView) {
            fetchBOMs(); // Ejecutar al montar
        }
    }, [canView]);

    // Cargar datos para edición si se abre el modal y hay un BOM seleccionado
    useEffect(() => {
        if (currentBomId && isModalOpen) {
            (async () => {
                try {
                    const data = await getArticlesId(currentBomId); // Obtener BOM específico
                    const bom = data.bom;
                    const clientData = await getClientsId(bom.client_id);
                    // Llenar formulario con datos existentes
                    setSelectedClient(clientData.id.toString());
                    setBaseQuantity(Number(bom.base_quantity));
                    setBomStatus(bom.status);
                    const articleData =
                        bom.details && bom.details !== "undefined" && bom.details !== null
                            ? JSON.parse(bom.details).article
                            : null;
                    setSelectedArticle(articleData);
                    const ingr =
                        bom.ingredients && bom.ingredients !== "undefined" && bom.ingredients !== null
                            ? JSON.parse(bom.ingredients)
                            : [];
                    setIngredients(ingr);
                } catch (error) {
                    showError("Error al cargar el BOM para edición.");
                    console.error("Error en getArticlesId:", error);
                }
            })();
        }
    }, [currentBomId, isModalOpen]);

    // Cargar artículos según el cliente seleccionado
    useEffect(() => {
        if (!selectedClient) return;
        const client = clients.find(c => c.id.toString() === selectedClient);
        if (!client) return;
        const loadData = async () => {
            setLoadingArticles(true);
            try {
                const articlesData = await getArticleByCode(client.code); // Obtener artículos por código cliente
                let fetchedArticles: Article[] = articlesData?.data || [];
                setAllArticles(fetchedArticles); // Guardar todos para futuras búsquedas
                // Filtrar el artículo principal para no repetirlo
                if (selectedArticle) {
                    fetchedArticles = fetchedArticles.filter(a => a.codart !== selectedArticle.codart);
                }
                setArticles(fetchedArticles); // Guardar para mostrar en lista
            } catch (error) {
                showError("Error al cargar artículos.");
                console.error(error);
            } finally {
                setLoadingArticles(false);
            }
        };

        loadData();
    }, [selectedClient, clients, selectedArticle]);

    // Reiniciar formulario si cambia cliente y no se está editando un BOM
    useEffect(() => {
        if (!currentBomId) {
            setSelectedArticle(null);
            setIngredients([]);
            setBomStatus(false);
        }
    }, [selectedClient, currentBomId]);

    // Seleccionar artículo principal
    const handleSelectArticle = (article: Article) => {
        if (selectedArticle) {
            showError("Ya has seleccionado un artículo. Elimina el actual para seleccionar otro.");
            return;
        }
        setSelectedArticle(article);
        setArticles(prev => prev.filter(a => a.codart !== article.codart)); // Eliminar de la lista para evitar duplicado
    };

    // Deseleccionar artículo principal
    const handleDeselectArticle = () => {
        if (selectedArticle) {
            setArticles(prev => [...prev, selectedArticle]); // Volver a agregarlo a la lista
            setSelectedArticle(null);
        }
    };

    // Cambiar campo de ingrediente
    const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setIngredients(newIngredients);
    };

    // Agregar fila de ingrediente
    const addIngredientRow = () => {
        setIngredients(prev => [
            ...prev,
            { codart: "", desart: "", quantity: "", merma: "", teorica: "" }
        ]);
    };

    // Quitar fila de ingrediente
    const removeIngredientRow = (index: number) => {
        setIngredients(prev => prev.filter((_, i) => i !== index));
    };

    // Guardar o actualizar BOM
    const handleSaveBOM = async () => {
        if (!selectedClient || !selectedArticle) {
            showError("Debes seleccionar un cliente y un artículo.");
            return;
        }

        setIsSaving(true);

        try {
            const code_details = JSON.stringify({ codart: selectedArticle.codart }); // Código rápido para búsqueda
            const code_ingredients = JSON.stringify(
                ingredients.map((ing) => ({ codart: ing.codart }))
            );

            const bomData = {
                client_id: Number(selectedClient),
                base_quantity: baseQuantity.toString(),
                details: JSON.stringify({ article: selectedArticle }),
                code_details,
                ingredients: JSON.stringify(ingredients),
                code_ingredients,
                status: bomStatus,
            };

            // Si se está editando, actualizar; si no, crear nuevo
            if (currentBomId) {
                await updateArticle(currentBomId, bomData);
                showSuccess("BOM actualizado con éxito");
            } else {
                await newArticle(bomData);
                showSuccess("BOM creado con éxito");
            }

            resetForm();
            fetchBOMs(); // Recargar lista de BOMs
        } catch (error) {
            showError("Error al guardar el BOM.");
            console.error("Error en handleSaveBOM:", error);
        } finally {
            setIsSaving(false);
            setIsModalOpen(false); // Cerrar modal
        }
    };

    // Reiniciar todos los campos del formulario
    const resetForm = () => {
        setSelectedClient("");
        setSelectedArticle(null);
        setIngredients([]);
        setBaseQuantity(0);
        setBomStatus(false);
        setCurrentBomId(null);
    };

    // Editar BOM existente
    const handleEdit = async (id: number) => {
        try {
            const data = await getArticlesId(id);
            const bom = data.bom;
            const clientData = await getClientsId(bom.client_id);

            // Cargar todos los campos en el formulario
            setSelectedClient(clientData.id.toString());
            setCurrentBomId(bom.id);
            setBaseQuantity(Number(bom.base_quantity));
            setBomStatus(bom.status);

            const articleData =
                bom.details && bom.details !== "undefined" && bom.details !== null
                    ? JSON.parse(bom.details).article
                    : null;
            setSelectedArticle(articleData);

            const ingr =
                bom.ingredients && bom.ingredients !== "undefined" && bom.ingredients !== null
                    ? JSON.parse(bom.ingredients)
                    : [];
            setIngredients(ingr);
            setIsModalOpen(true);
        } catch (error) {
            console.error("Error obteniendo datos de la BOM:", error);
            showError("Error obteniendo datos de la BOM");
        }
    };

    // Eliminar BOM con confirmación
    const handleDelete = async (id: number) => {
        if (!canEdit) return;
        showConfirm("¿Estás seguro de eliminar este BOM?", async () => {
            try {
                await deleteArticle(id);
                showSuccess("BOM eliminado exitosamente");
                fetchBOMs(); // Recargar lista
            } catch (error) {
                console.error("Error al eliminar BOM:", error);
                showError("Error al eliminar BOM");
            }
        });
    };

    // Seleccionar ingrediente desde lista de artículos
    const handleIngredientSelect = (index: number, selectedCodart: string) => {
        const selectedArticleForIngredient = allArticles.find(article => article.codart === selectedCodart);
        if (selectedArticleForIngredient) {
            const newIngredients = [...ingredients];
            newIngredients[index] = {
                ...newIngredients[index],
                codart: selectedArticleForIngredient.codart,
                desart: selectedArticleForIngredient.desart,
            };
            setIngredients(newIngredients);
        }
    };

    return (
        <div>
            <div className="flex justify-center space-x-2 mb-2">
                {canEdit && (
                    <Button
                        onClick={() => {
                            resetForm();
                            setIsModalOpen(true);
                        }}
                        variant="create"
                        label="Crear BOM"
                    />
                )}
            </div>

            {isModalOpen && (
                <ModalSection isVisible={isModalOpen} onClose={() => { setIsModalOpen(false) }}>
                    <Text type="title">
                        {currentBomId ? "Editar BOM" : "Crear BOM"}
                    </Text>

                    <div className="mb-4">
                        <Text type="subtitle">Selecciona un Cliente:</Text>
                        <select
                            className="w-full border p-2 rounded text-black text-center"
                            value={selectedClient}
                            onChange={e => setSelectedClient(e.target.value)}
                            disabled={!canEdit}
                        >
                            <option value="">Seleccione...</option>
                            {clients.map(client => (
                                <option key={client.code} value={client.id.toString()}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {(selectedClient || currentBomId) && (
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                                <Text type="subtitle">Artículos Disponibles:</Text>
                                <div className="mb-2">
                                    <input
                                        type="text"
                                        placeholder="Buscar artículos..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="border p-2 rounded w-full text-black"
                                        disabled={!canEdit}
                                    />
                                </div>
                                {loadingArticles ? (
                                    <p className="text-blue-500">Cargando artículos...</p>
                                ) : filteredArticles.length > 0 ? (
                                    <ul className="border p-2 rounded bg-gray-100 h-40 overflow-y-auto">
                                        {filteredArticles.map((article) => (
                                            <li
                                                key={article.codart}
                                                className={`border-b py-1 px-2 text-black cursor-pointer transition ${canEdit ? "hover:bg-blue-100" : "text-gray-400 cursor-not-allowed"
                                                    }`}
                                                onClick={() => {
                                                    if (canEdit) handleSelectArticle(article);
                                                }}
                                                title={!canEdit ? "No tienes permiso para seleccionar artículos" : ""}
                                            >
                                                {article.desart} ({article.codart})
                                            </li>

                                        ))}
                                    </ul>
                                ) : (
                                    <Text type="error">No se encontraron coincidencias.</Text>
                                )}
                            </div>

                            <div>
                                <Text type="subtitle">Artículo Seleccionado:</Text>
                                {selectedArticle ? (
                                    <div className="border p-2 rounded bg-gray-100 flex justify-between items-center">
                                        <span className="text-black">
                                            {selectedArticle.desart} ({selectedArticle.codart})
                                        </span>
                                        <button
                                            onClick={handleDeselectArticle}
                                            className="bg-red-500 text-white px-2 py-1 rounded"
                                            disabled={!canEdit}
                                        >
                                            X
                                        </button>
                                    </div>
                                ) : (
                                    <Text type="alert">No se ha seleccionado ningún artículo.</Text>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center space-x-2">
                        <div className="mt-4">
                            <Text type="subtitle">Cantidad Base:</Text>
                            <input
                                type="number"
                                min="0"
                                className="w-full border p-2 rounded text-black text-center"
                                value={baseQuantity}
                                onChange={e => setBaseQuantity(Number(e.target.value))}
                                disabled={!canEdit}
                            />
                        </div>

                        <div className="mt-4">
                            <Text type="subtitle">Estado:</Text>
                            <select
                                className="w-full border p-2 rounded text-black text-center"
                                value={bomStatus ? "activo" : "inactivo"}
                                onChange={e => setBomStatus(e.target.value === "activo")}
                                disabled={!canEdit}
                            >
                                <option value="activo">Activo</option>
                                <option value="inactivo">Inactivo</option>
                            </select>
                        </div>
                    </div>

                    {selectedArticle && (
                        <div className="mt-4">
                            <Text type="subtitle">Materiales:</Text>
                            <div className="border p-4 rounded bg-gray-50 space-y-4">
                                {ingredients.length > 0 ? (
                                    ingredients.map((ing, index) => (
                                        <div key={index} className="flex flex-col space-y-2 border p-2 rounded bg-white">
                                            <div className="flex items-center space-x-2 w-full">
                                                <select
                                                    className="border p-1 rounded text-black w-[70%]"
                                                    value={ing.codart}
                                                    onChange={e => handleIngredientSelect(index, e.target.value)}
                                                    disabled={!canEdit}
                                                >
                                                    <option value="">Seleccione un artículo</option>
                                                    {allArticles.map(article => (
                                                        <option key={article.codart} value={article.codart}>
                                                            {article.desart} ({article.codart})
                                                        </option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number"
                                                    className="border p-1 rounded text-black w-[15%] text-center"
                                                    placeholder="Cantidad"
                                                    value={ing.quantity}
                                                    onChange={e => handleIngredientChange(index, "quantity", e.target.value)}
                                                    disabled={!canEdit}
                                                />
                                                <input
                                                    type="number"
                                                    className="border p-1 rounded text-black w-[15%] text-center"
                                                    placeholder="% Merma"
                                                    value={ing.merma}
                                                    onChange={e => handleIngredientChange(index, "merma", e.target.value)}
                                                    disabled={!canEdit}
                                                />
                                                <button
                                                    onClick={() => removeIngredientRow(index)}
                                                    className="bg-red-500 text-white px-2 py-1 rounded"
                                                    disabled={!canEdit}
                                                >
                                                    X
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <Text type="alert">No hay ingredientes agregados.</Text>
                                )}

                                <Button onClick={addIngredientRow} variant="create" label="Agregar Ingrediente" disabled={!canEdit} />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-4 mt-4">
                        <Button onClick={() => setIsModalOpen(false)} variant="cancel" label="Cancelar" />
                        {canEdit && (
                            <Button
                                onClick={handleSaveBOM}
                                variant="create"
                                label={currentBomId ? "Actualizar BOM" : "Guardar BOM"}
                                disabled={loadingArticles || isSaving}
                            />
                        )}
                    </div>
                </ModalSection>
            )}

            <Table
                columns={["client_name", "article_codart", "article_desart", "status"]}
                rows={boms}
                columnLabels={{
                    client_name: "Cliente",
                    article_codart: "Código Artículo",
                    article_desart: "Descripción Artículo",
                    status: "Estado",
                }}
                onDelete={canEdit ? handleDelete : undefined}
                onEdit={handleEdit}
            />

        </div>
    );
}

export default BOMManager;
