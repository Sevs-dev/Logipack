import React, { useState, useEffect, useMemo } from "react";
import { ClipboardCopy } from 'lucide-react';
// 🔹 Servicios
import { getClients, getClientsId } from "@/app/services/userDash/clientServices";
import { getFactory } from "@/app/services/userDash/factoryServices";
import { getPrefix } from "@/app/services/consecutive/consecutiveServices";
import { getArticleByCode, getArticleByClient } from "@/app/services/bom/articleServices";
import { newAdaptation, getAdaptations, deleteAdaptation, updateAdaptation, getAdaptationsId } from "@/app/services/adaptation/adaptationServices";
import { getMaestra } from "../../services/maestras/maestraServices";
import { getAuditsByModelAdaptation } from "../../services/history/historyAuditServices";
// 🔹 Componentes
import Button from "../buttons/buttons";
import File from "../buttons/FileButton";
import MultiSelect from "../dinamicSelect/MultiSelect";
import Table from "../table/Table";
import Text from "../text/Text";
import ModalSection from "../modal/ModalSection";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
import AuditModal from "../history/AuditModal";
// 🔹 Toastr
import { showSuccess, showError, showConfirm } from "../toastr/Toaster";
// 🔹 Interfaces
import { Client } from "@/app/interfaces/Client";
import { Article, Ingredient, Bom } from "@/app/interfaces/BOM";
import { MaestraBase } from "@/app/interfaces/NewMaestra";
import { BOM, Adaptation, ArticleFormData, Plant } from "@/app/interfaces/NewAdaptation";
import { Audit } from "../../interfaces/Audit";

function NewAdaptation({ canEdit = false, canView = false }: CreateClientProps) {
    // UI
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Cliente y Planta
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<number | "">("");
    const [plantas, setPlantas] = useState<Plant[]>([]);
    const [planta, setPlanta] = useState<string>("");

    // Maestra
    const [maestra, setMaestra] = useState<MaestraBase[]>([]);
    const [selectedMaestras, setSelectedMaestras] = useState<string[]>([]);

    // Artículos
    const [articles, setArticles] = useState<Article[]>([]);
    const [selectedArticles, setSelectedArticles] = useState<Article[]>([]);
    const [articleFields, setArticleFields] = useState<Record<string, ArticleFormData>>({});

    // Orden y datos de producción
    const [client_order, setClientOrder] = useState<string>("");
    const [orderNumber, setOrderNumber] = useState<string>("");
    const [deliveryDate, setDeliveryDate] = useState<string>("");
    const [quantityToProduce, setQuantityToProduce] = useState("");
    const [lot, setLot] = useState<string>("");
    const [healthRegistration, setHealthRegistration] = useState<string>("");

    // BOM e Ingredientes
    const [boms, setBoms] = useState<BOM[]>([]);
    const [selectedBom, setSelectedBom] = useState<number | "">("");
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);

    // Adaptaciones
    const [adaptation, setAdaptation] = useState<Adaptation[]>([]);
    const [editAdaptationId, setEditAdaptationId] = useState<number | null>(null);

    // Adjuntos
    const [attachment, setAttachment] = useState<File | null>(null);
    const [, setAttachmentUrl] = useState<string | null>(null);

    // Consecutivo
    const [, setConsecutivo] = useState<string | null>(null);

    // Auditoría (por si se usa después)
    const [auditList, setAuditList] = useState<Audit[]>([]);
    const [, setSelectedAudit] = useState<Audit | null>(null);

    // Cargar Adaptaciones al montar si se puede ver
    useEffect(() => {
        if (canView) fetchAdaptations();
    }, [canView]);

    // Cargar Clientes
    useEffect(() => {
        const fetchClients = async () => {
            try {
                setIsLoading(true);
                const clientsData = await getClients();
                setClients(clientsData);
            } catch (err) {
                showError("Error al cargar los clientes.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchClients();
    }, []);

    // Cargar Plantas
    useEffect(() => {
        const fetchFactories = async () => {
            try {
                setIsLoading(true);
                const data = await getFactory();
                setPlantas(data);
            } catch (err) {
                showError("Error al cargar las plantas.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFactories();
    }, []);

    // Cargar Maestras
    useEffect(() => {
        const fetchMaestras = async () => {
            try {
                setIsLoading(true);
                const maestrasData = await getMaestra();
                setMaestra(maestrasData);
            } catch {
                showError("Error al cargar las maestras.");
                // Optionally, you can log the error if needed
            } finally {
                setIsLoading(false);
            }
        };
        fetchMaestras();
    }, []);

    // Cargar Artículos por Cliente
    useEffect(() => {
        if (!selectedClient) return;
        let isMounted = true;
        const fetchArticles = async () => {
            try {
                setIsLoading(true);
                const clientData = await getClientsId(Number(selectedClient));

                if (!clientData?.code) {
                    showError("Código de cliente no disponible.");
                    return;
                }
                const articlesData = await getArticleByCode(clientData.code);
                const list = articlesData.data || [];

                if (isMounted) {
                    setArticles(list);

                    if (list.length === 0) {
                        showError("Este cliente no tiene artículos disponibles.");
                    }
                }
            } catch (err) {
                if (isMounted) showError("Error al cargar los artículos.");
                console.error(err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchArticles();
        return () => {
            isMounted = false;
        };
    }, [selectedClient]);

    // Actualizar artículos seleccionados cuando los datos cambian
    useEffect(() => {
        if (articles.length > 0 && selectedArticles.length > 0) {
            const formatted = articles.filter(article =>
                selectedArticles.some(sel => sel.codart === article.codart)
            );
            setSelectedArticles(prev =>
                JSON.stringify(prev) !== JSON.stringify(formatted) ? formatted : prev
            );
        }
    }, [articles, selectedArticles]);

    // Cargar BOM e Ingredientes si se requiere
    useEffect(() => {
        if (!selectedClient || selectedMaestras.length === 0) return;
        const selectedMaestraObj = maestra.find(m => m.id.toString() === selectedMaestras[0]);
        if (!selectedMaestraObj?.requiere_bom) {
            setBoms([]);
            setIngredients([]);
            return;
        }
        const fetchBom = async () => {
            try {
                const clientData = await getClientsId(Number(selectedClient));
                const boms: Bom[] = await getArticleByClient(clientData.id);
                if (!Array.isArray(boms)) {
                    console.error("❌ La respuesta de BOMs no es un array:", boms);
                    setBoms([]);
                    setIngredients([]);
                    return;
                }
                // Filtrar solo BOMs activos (status === 1)
                const bomsActivos = boms.filter(b => b.status);
                if (bomsActivos.length === 0) {
                    setBoms([]);
                    setIngredients([]);
                    return;
                }
                // Ordenar por versión descendente (más reciente primero)
                const bomsOrdenados = [...bomsActivos].sort(
                    (a, b) => Number(b.version) - Number(a.version)
                );
                const latestBom = bomsOrdenados[0];
                // Setear solo los activos con status 1
                setBoms(bomsActivos.map(b => ({ ...b, status: 1 })));

                if (latestBom.ingredients) {
                    try {
                        const parsed = JSON.parse(latestBom.ingredients);
                        setIngredients(parsed);
                    } catch {
                        setIngredients([]);
                    }
                } else {
                    setIngredients([]);
                }
            } catch {
                showError("Error al obtener BOM.");
                setBoms([]);
                setIngredients([]);
            }
        };
        fetchBom();
    }, [selectedClient, selectedMaestras, maestra]);

    // Recalcular ingredientes cuando cambia cantidad
    useEffect(() => {
        if (quantityToProduce === "") return;

        const qty = Number(quantityToProduce);
        if (!ingredients.length || isNaN(qty)) return;

        setIngredients(prevIngredients =>
            prevIngredients.map((ing) => {
                const merma = parseFloat(ing.merma || "0"); // 🛡️ por si viene vacío
                const teorica = qty + qty * merma;
                return {
                    ...ing,
                    teorica: isNaN(teorica) ? "" : teorica.toFixed(4),
                };
            })
        );
    }, [quantityToProduce, ingredients.length]);

    // ======================= 🔁 Funciones de cambio y copia =======================

    const handlePlantaChange = async (value: string) => {
        setPlanta(value);
        const selected = plantas.find(p => p.id.toString() === value);
        if (!selected?.prefix) return;

        try {
            const { consecutives } = await getPrefix(selected.prefix);
            if (consecutives?.length) {
                const cons = consecutives[0];
                setConsecutivo(cons);
                setClientOrder(`${cons.prefix}-${cons.year}-${cons.month}-${cons.consecutive}`);
            }
        } catch (error) {
            console.error("Error al obtener el consecutivo:", error);
        }
    };

    const copyToClipboard = () => {
        if (client_order) {
            navigator.clipboard.writeText(client_order);
            showSuccess("Orden copiada al portapapeles");
        }
    };

    const visualOrder = useMemo(() => {
        if (!client_order) {
            return "";
        }
        if (!/\d{7}$/.test(client_order)) {
            return "";
        }
        if (client_order.endsWith("0000000")) {
            return "";
        }
        const match = client_order.match(/(\d{7})$/)?.[1];
        if (match) {
            const incremented = String(parseInt(match, 10) + 1).padStart(7, "0");
            const newOrder = client_order.replace(/(\d{7})$/, incremented);
            return newOrder;
        }
        console.log("⚠️ No se encontró match válido, retornando vacío");
        return "";
    }, [client_order]);

    // ======================= 📦 Memos y helpers =======================

    const maestraSeleccionada = useMemo(() => {
        return maestra.find(m => m.id.toString() === selectedMaestras[0]);
    }, [selectedMaestras, maestra]);

    const maestraRequiereBOM = maestraSeleccionada?.requiere_bom ?? false;

    const handleChange = (index: number, field: keyof Ingredient, value: string): void => {
        const updated = [...ingredients];

        updated[index] = {
            ...updated[index],
            [field]: value,
            ...(field === "teorica" ? { manualEdit: true } : {})
        };
        setIngredients(updated);
    };

    const handleFieldChange = <K extends keyof ArticleFormData>(
        codart: string,
        field: K,
        value: ArticleFormData[K]
    ) => {
        setArticleFields(prev => ({
            ...prev,
            [codart]: {
                ...prev[codart],
                [field]: value,
            },
        }));
    };

    // ======================= 📥 Carga de datos =======================

    const fetchAdaptations = async () => {
        try {
            const adaptations = await getAdaptations();
            const fullData = await Promise.all(
                adaptations.map(async (a: Adaptation) => {
                    const client = await getClientsId(a.client_id);
                    return { ...a, client_name: client.name, numberOrder: client.number_order };
                })
            );
            setAdaptation(fullData);
        } catch (error) {
            showError("Error al cargar adaptaciones.");
            console.error(error);
        }
    };

    // ======================= 📤 Envío del formulario =======================

    const handleSubmit = async () => {
        if (!selectedClient) return showError("Selecciona un Cliente.");
        if (!planta) return showError("Selecciona una Planta.");
        if (!selectedArticles.length) return showError("Selecciona al menos un artículo.");
        if (!selectedMaestras.length) return showError("Selecciona una Maestra.");

        let articlesData;

        if (maestraRequiereBOM) {
            if (!orderNumber || !deliveryDate || !quantityToProduce || !lot || !healthRegistration) {
                return showError("Completa todos los campos del artículo.");
            }

            articlesData = [{
                codart: selectedArticles[0]?.codart || "",
                number_order: client_order,
                orderNumber,
                deliveryDate,
                quantityToProduce,
                lot,
                healthRegistration,
            }];
        } else {
            const invalids = selectedArticles.filter(({ codart }) => {
                const f = articleFields[codart];
                const missing = ["orderNumber", "deliveryDate", "quantityToProduce", "lot", "healthRegistration"]
                    .filter(k => !f?.[k as keyof ArticleFormData]);
                if (missing.length) {
                    showError(`Faltan campos en ${codart}: ${missing.join(", ")}`);
                    return true;
                }
                return false;
            });
            if (invalids.length) return;

            articlesData = selectedArticles.map(({ codart }) => {
                const f = articleFields[codart];
                return {
                    codart,
                    number_order: client_order,
                    orderNumber: f.orderNumber,
                    deliveryDate: f.deliveryDate,
                    quantityToProduce: f.quantityToProduce,
                    lot: f.lot,
                    healthRegistration: f.healthRegistration,
                };
            });
        }

        const formData = new FormData();
        formData.append("client_id", String(selectedClient));
        formData.append("factory_id", planta);
        formData.append("article_code", JSON.stringify(articlesData));
        formData.append("number_order", client_order);
        formData.append("orderNumber", orderNumber);
        formData.append("master", selectedMaestras[0]);
        formData.append("bom", selectedBom !== "" ? String(selectedBom) : "");
        formData.append("ingredients", JSON.stringify(ingredients));

        if (maestraRequiereBOM) {
            if (attachment) formData.append("attachment", attachment);
        } else {
            selectedArticles.forEach(({ codart }) => {
                const file = articleFields[codart]?.attachment;
                if (file) formData.append(`attachment_${codart}`, file);
            });
        }

        try {
            setIsLoading(true);
            if (isEditMode) {
                console.log("📝 Actualizando adaptación con ID:", editAdaptationId);
                for (const [key, value] of formData.entries()) {
                    console.log(`📦 ${key}:`, value);
                }
                await updateAdaptation(editAdaptationId!, formData);
                showSuccess("Acondicionamiento actualizado.");
            } else {
                await newAdaptation(formData);
                showSuccess("Acondicionamiento creado.");
            }

            resetForm();
            setIsOpen(false);
            fetchAdaptations();
        } catch (error: unknown) {
            showError("Error al guardar.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // ======================= ✏️ Edición =======================

    const handleEdit = async (id: number) => {
        try {
            const { adaptation } = await getAdaptationsId(id);
            console.log("🔍 Adaptación encontrada:", adaptation.master);
            if (!adaptation) {
                showError("La adaptación no existe");
                console.warn("⚠️ Adaptation no encontrada con ID:", id);
                return;
            }
            setIsEditMode(true);
            setEditAdaptationId(id);
            setSelectedClient(adaptation.client_id?.toString() ?? "");
            setPlanta(adaptation.factory_id?.toString() ?? "");
            setSelectedMaestras(adaptation.master?.toString() ?? "");
            setSelectedBom(adaptation.bom?.toString() ?? "");
            const parsedArticles = adaptation.article_code ? JSON.parse(adaptation.article_code) : [];
            setSelectedArticles(parsedArticles.map((a: { codart: string }) => ({ codart: a.codart })));
            setClientOrder(adaptation.number_order || "");

            if (adaptation.bom) {
                const general = parsedArticles[0] || {};
                setOrderNumber(general.orderNumber ?? "");
                setClientOrder(general.client_order ?? adaptation.number_order ?? "");
                setDeliveryDate(formatDate(general.deliveryDate ?? ""));
                setQuantityToProduce(String(general.quantityToProduce ?? ""));
                setLot(general.lot ?? "");
                setHealthRegistration(general.healthRegistration ?? "");
                setAttachment(null);
                setAttachmentUrl(general.attachment ? `/storage/${general.attachment}` : null);
                setArticleFields({});
            } else {
                const fieldsMap: Record<string, ArticleFormData> = {};
                parsedArticles.forEach((a: {
                    codart: string;
                    orderNumber?: string;
                    client_order?: string;
                    deliveryDate?: string;
                    quantityToProduce?: number | string;
                    lot?: string;
                    healthRegistration?: string;
                    attachment?: File;
                }) => {
                    fieldsMap[a.codart] = {
                        orderNumber: a.orderNumber ?? "",
                        numberOrder: a.client_order ?? "",
                        deliveryDate: formatDate(a.deliveryDate ?? ""),
                        quantityToProduce: Number(a.quantityToProduce) ?? "",
                        lot: a.lot ?? "",
                        healthRegistration: a.healthRegistration ?? "",
                        attachment: a.attachment,
                    };
                });
                setArticleFields(fieldsMap);
            }

            if (adaptation.ingredients) {
                try {
                    const parsed = JSON.parse(adaptation.ingredients) as Ingredient[];
                    const enriched = parsed.map(i => {
                        const hasValidTeorica =
                            i.teorica !== undefined &&
                            i.teorica !== null &&
                            !isNaN(Number(i.teorica));

                        const teoricaCalculada = (Number(i.quantity || 0) * (1 + Number(i.merma || 0))).toFixed(4);

                        return {
                            ...i,
                            teorica: hasValidTeorica ? Number(i.teorica).toFixed(4) : teoricaCalculada,
                        };
                    });
                    setIngredients(enriched);
                } catch {
                    setIngredients([]);
                }
            } else {
                setIngredients([]);
            }

            setIsOpen(true);
        } catch (error) {
            showError("Error al cargar la adaptación.");
            console.error("💥 Error en handleEdit:", error);
        }
    };

    // ======================= 🗑️ Eliminación =======================

    const handleDelete = async (id: number) => {
        if (!canEdit) return;
       
        showConfirm("¿Seguro que quieres eliminar esta Adaptación?", async () => {
            try {
                await deleteAdaptation(id);
                setAdaptation(adaptation.filter(a => a.id !== id));
                showSuccess("Adaptación eliminada correctamente.");
            } catch {
                showError("Error al eliminar la adaptación.");
            }
        });
    };

    // ======================= 🧰 Utilidades =======================

    const formatDate = (dateString: string): string => {
        const dt = new Date(dateString);
        return isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
    };

    const resetForm = () => {
        setSelectedClient("");
        setPlanta("");
        setClientOrder("");
        setSelectedArticles([]);
        setSelectedMaestras([]);
        setSelectedBom("");
        setOrderNumber("");
        setDeliveryDate("");
        setQuantityToProduce("");
        setLot("");
        setHealthRegistration("");
        setAttachment(null);
        setIngredients([]);
    };

    const handleHistory = async (id: number) => {
        const model = "Adaptation";
        try {
            const data = await getAuditsByModelAdaptation(model, id);
            setAuditList(data);
            if (data.length > 0) setSelectedAudit(data[0]); // opción: mostrar la primera al abrir
        } catch (error) {
            console.error("Error al obtener la auditoría:", error);
        }
    };

    return (
        <div>
            <div className="flex justify-center space-x-2 mb-2">
                {canEdit && (
                    <Button onClick={() => {
                        resetForm();
                        setIsOpen(true);
                    }} variant="create" label="Crear Acondicionamiento" />
                )}
            </div>

            {isOpen && (
                <ModalSection isVisible={isOpen} onClose={() => (resetForm(), setIsOpen(false))} >
                    <Text type="title" color="text-[#000]">
                        {isEditMode ? "Editar" : "Crear"} Acondicionamiento
                    </Text>

                    {/* Loading spinner */}
                    {isLoading && (
                        <div className="flex justify-center py-4">
                            <div className="w-12 h-12 border-t-4 border-blue-500 rounded-full animate-spin"></div>
                        </div>
                    )}

                    {/* Contenido responsivo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Cliente */}
                        <div className="col-span-full">
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <Text type="subtitle" color="#000">Planta:</Text>
                                    <select
                                        className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                        value={planta}
                                        onChange={e => handlePlantaChange(e.target.value)}
                                        disabled={!canEdit}
                                    >
                                        <option value="">Seleccione...</option>
                                        {plantas.map((plant) => (
                                            <option key={plant.id} value={plant.id.toString()}>
                                                {plant.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="w-1/2">
                                    <Text type="subtitle" color="#000">Cliente:</Text>
                                    <select
                                        className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                        value={selectedClient}
                                        onChange={e => {
                                            setSelectedClient(Number(e.target.value));
                                            setIngredients([]);
                                        }}
                                        disabled={!canEdit}
                                    >
                                        <option value="">Seleccione...</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id.toString()}>
                                                {client.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-1/2 max-w-md relative group space-y-2 mt-1">
                                    {/* Label */}
                                    <Text type="subtitle" color="#000">
                                        Orden:
                                    </Text>

                                    {/* Contenedor visual + botón */}
                                    <div className="relative bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 mt-2 shadow-sm">
                                        {/* VisualOrder visible */}
                                        <p className="text-center font-mono text-sm text-gray-800 tracking-wide select-none">
                                            {visualOrder || "Cargando orden..."}
                                        </p>

                                        {/* Botón copiar */}
                                        <button
                                            type="button"
                                            onClick={copyToClipboard}
                                            className="absolute top-1/2 right-3 transform -translate-y-1/2 
                                            text-gray-400 hover:text-blue-600 transition-colors duration-200 
                                            focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
                                            title="Copiar al portapapeles"
                                        >
                                            <ClipboardCopy size={20} />
                                            {/* Tooltip flotante */}
                                            <span className="absolute hidden group-hover:block -top-8 right-0 
                                             bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-50">
                                                Copiar
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Maestras y BOM*/}
                        <div>
                            <Text type="subtitle" color="#000">Maestras:</Text>
                            <select
                                className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500  text-center"
                                value={selectedMaestras.length > 0 ? selectedMaestras[0] : ""}
                                onChange={(e) => setSelectedMaestras([e.target.value])}
                                disabled={!canEdit}
                            >
                                <option value="">Seleccione...</option>
                                {maestra.map((master) => (
                                    <option
                                        key={master.id}
                                        value={master.id.toString()}
                                        disabled={Number(master.aprobado) === 0}
                                    >
                                        {master.descripcion}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col justify-end">
                            <Text type="subtitle" color="text-gray-700">Adjuntar:</Text>
                            {canEdit && (
                                <File
                                    onChange={(fileList) => {
                                        const file = Array.isArray(fileList) ? fileList[0] : fileList;
                                        setAttachment(file ?? null);
                                    }}
                                    maxSizeMB={5}
                                    allowMultiple={true}
                                />
                            )}
                        </div>
                        <div
                            className={`col-span-full grid grid-cols-1 ${maestraRequiereBOM ? "sm:grid-cols-2" : "lg:grid-cols-1"
                                } gap-4`}
                        >
                            {/* Select de Maestras */}
                            {/* Select de BOM solo si se requiere */}
                            {maestraRequiereBOM && (
                                <div>
                                    <Text type="subtitle" color="#000">BOM:</Text>
                                    <select
                                        className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                        onChange={(e) => {
                                            const selectedBomId = Number(e.target.value);
                                            setSelectedBom(selectedBomId);

                                            const bom = boms.find((b) => b.id === selectedBomId);
                                            const codart = JSON.parse(bom?.code_details || "{}")?.codart;

                                            if (codart) {
                                                const matchingArticle = articles.find((a) => a.codart === codart);
                                                if (matchingArticle) {
                                                    setSelectedArticles([matchingArticle]);
                                                } else {
                                                    showError("No se encontró un artículo que coincida con el BOM.");
                                                    setSelectedArticles([]);
                                                }
                                            } else {
                                                setSelectedArticles([]);
                                            }
                                        }}
                                        disabled={!canEdit}
                                        value={selectedBom || ""}
                                    >
                                        <option value="">Seleccione un BOM...</option>
                                        {Array.isArray(boms) && boms.length > 0 ? (
                                            boms.map((bom) => (
                                                <option key={bom.id} value={bom.id}>
                                                    {JSON.parse(bom.code_details || "{}")?.codart ?? "Sin código"}
                                                </option>
                                            ))
                                        ) : (
                                            <option disabled>No hay BOMs disponibles</option>
                                        )}
                                    </select>
                                </div>
                            )}
                            {/* MultiSelect Articulos*/}
                            <div>
                                <Text type="subtitle" color="#000">Artículos:</Text>

                                {maestraRequiereBOM ? (
                                    <select
                                        className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                        onChange={(e) => {
                                            const selectedBomId = Number(e.target.value);
                                            setSelectedBom(selectedBomId);
                                            const bom = boms.find(b => b.id === selectedBomId);
                                            let codart = "";
                                            try {
                                                if (bom?.code_details) {
                                                    const parsed = JSON.parse(bom.code_details);
                                                    codart = parsed?.codart || "";
                                                    console.log("🧩 code_details parseado:", parsed);
                                                } else {
                                                    console.warn("⚠️ BOM sin code_details o está vacío:", bom);
                                                }
                                            } catch (error) {
                                                console.error("❌ Error al parsear code_details:", bom?.code_details, error);
                                            }

                                            if (codart) {
                                                const matchingArticle = articles.find(a => a.codart === codart);
                                                if (matchingArticle) {
                                                    console.log("✅ Artículo asociado al BOM:", matchingArticle);
                                                    setSelectedArticles([matchingArticle]);
                                                } else {
                                                    console.warn("❗ codart no coincide con ningún artículo:", codart);
                                                }
                                            } else {
                                                console.warn("❌ codart vacío tras parsear el BOM");
                                            }
                                        }}
                                        disabled={!canEdit}
                                        value={selectedBom || ""}
                                    >
                                        <option value="">Seleccione un BOM...</option>
                                        {Array.isArray(boms) && boms.length > 0 ? (
                                            boms.map((bom) => {
                                                let label = "Sin código";
                                                try {
                                                    const parsed = JSON.parse(bom.code_details || "{}");
                                                    label = parsed?.codart || "Sin código";
                                                } catch {
                                                    console.warn("❌ BOM con code_details inválido:", bom.code_details);
                                                }

                                                return (
                                                    <option key={bom.id} value={bom.id}>
                                                        {label}
                                                    </option>
                                                );
                                            })
                                        ) : (
                                            <option disabled>No hay BOMs disponibles</option>
                                        )}
                                    </select>
                                ) : (
                                    articles.length > 0 ? (
                                        <MultiSelect
                                            options={articles}
                                            selected={selectedArticles}
                                            onChange={setSelectedArticles}
                                            getLabel={(article) => article.codart}
                                            getValue={(article) => article.codart}
                                        />
                                    ) : (
                                        <p className="text-sm italic text-gray-500 mt-2 text-center">
                                            No hay artículos disponibles para este cliente.
                                        </p>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Campos en grid responsivo */}
                        {maestraRequiereBOM ? (
                            <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border border-gray-300 rounded-md bg-white shadow-sm hover:shadow-md transition-shadow">
                                {/* Número de Orden */}
                                <div>
                                    <Text type="subtitle" color="#000">N° Orden del Cliente Con:</Text>
                                    <input
                                        type="text"
                                        className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                        value={orderNumber}
                                        onChange={e => setOrderNumber(e.target.value)}
                                        disabled={!canEdit}
                                    />
                                </div>

                                {/* Fecha Entrega */}
                                <div>
                                    <Text type="subtitle" color="#000">Fecha Entrega:</Text>
                                    <input
                                        type="date"
                                        className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                        value={deliveryDate}
                                        onChange={e => setDeliveryDate(e.target.value)}
                                        disabled={!canEdit}
                                    />
                                </div>

                                {/* Cantidad a producir */}
                                <div>
                                    <Text type="subtitle" color="#000">Cantidad a Producir:</Text>
                                    <input
                                        type="number"
                                        className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                        value={quantityToProduce ?? ""} // Evita undefined
                                        onChange={e => setQuantityToProduce(e.target.value)}
                                        min={1}
                                        disabled={!canEdit}
                                    />
                                </div>

                                {/* Lote */}
                                <div>
                                    <Text type="subtitle" color="#000">Lote:</Text>
                                    <input
                                        type="text"
                                        className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                        value={lot}
                                        onChange={e => setLot(e.target.value)}
                                        disabled={!canEdit}
                                    />
                                </div>

                                {/* Registro Sanitario */}
                                <div>
                                    <Text type="subtitle" color="#000">Registro Sanitario:</Text>
                                    <input
                                        type="text"
                                        className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                        value={healthRegistration}
                                        onChange={e => setHealthRegistration(e.target.value)}
                                        disabled={!canEdit}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 col-span-full sm:grid-cols-2  rounded-xl p-4 bg-white shadow-sm">
                                {selectedArticles.map((article) => (
                                    <div
                                        key={article.codart}
                                        className="border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-5 flex flex-col gap-4 "
                                    >
                                        <Text type="title" color="text-gray-800">
                                            Artículo: {article.codart}
                                        </Text>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                            {/* N° Orden del Cliente */}
                                            <div>
                                                <Text type="subtitle" color="text-gray-700">N° Orden del Cliente:</Text>
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-300 p-2 rounded-md mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 text-center text-gray-800"
                                                    value={articleFields[article.codart]?.orderNumber || ""}
                                                    onChange={(e) =>
                                                        handleFieldChange(article.codart, "orderNumber", e.target.value)
                                                    }
                                                    disabled={!canEdit}
                                                />
                                            </div>

                                            {/* Fecha Entrega */}
                                            <div>
                                                <Text type="subtitle" color="text-gray-700">Fecha Entrega:</Text>
                                                <input
                                                    type="date"
                                                    className="w-full border border-gray-300 p-2 rounded-md mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 text-center text-gray-800"
                                                    value={articleFields[article.codart]?.deliveryDate || ""}
                                                    onChange={(e) =>
                                                        handleFieldChange(article.codart, "deliveryDate", e.target.value)
                                                    }
                                                    disabled={!canEdit}
                                                />
                                            </div>

                                            {/* Cant. Teórica */}
                                            <div>
                                                <Text type="subtitle" color="text-gray-700">Cant. a Producir:</Text>
                                                <input
                                                    type="number"
                                                    className="w-full border border-gray-300 p-2 rounded-md mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 text-center text-gray-800"
                                                    value={articleFields[article.codart]?.quantityToProduce || ""}
                                                    onChange={(e) =>
                                                        handleFieldChange(
                                                            article.codart,
                                                            "quantityToProduce",
                                                            Number(e.target.value)
                                                        )
                                                    }
                                                    disabled={!canEdit}
                                                />
                                            </div>

                                            {/* Lote */}
                                            <div>
                                                <Text type="subtitle" color="text-gray-700">Lote:</Text>
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-300 p-2 rounded-md mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 text-center text-gray-800"
                                                    value={articleFields[article.codart]?.lot || ""}
                                                    onChange={(e) =>
                                                        handleFieldChange(article.codart, "lot", e.target.value)
                                                    }
                                                    disabled={!canEdit}
                                                />
                                            </div>

                                            {/* R. Sanitario */}
                                            <div>
                                                <Text type="subtitle" color="text-gray-700">R. Sanitario:</Text>
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-300 p-2 rounded-md mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 text-center text-gray-800"
                                                    value={articleFields[article.codart]?.healthRegistration || ""}
                                                    onChange={(e) =>
                                                        handleFieldChange(article.codart, "healthRegistration", e.target.value)
                                                    }
                                                    disabled={!canEdit}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Materiales */}
                        {maestraRequiereBOM ? (
                            <div className="col-span-full">
                                <Text type="subtitle" color="#000">Materiales:</Text>
                                <div>
                                    <table className="w-full border-collapse border border-black text-black">
                                        <thead>
                                            <tr className="bg-gray-200">
                                                <th className="border border-black p-2 text-center">Codart</th>
                                                <th className="border border-black p-2 text-center">Desart</th>
                                                <th className="border border-black p-2 text-center">Merma%</th>
                                                <th className="border border-black p-2 text-center">Cantidad Teórica</th>
                                                <th className="border border-black p-2 text-center">Validar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ingredients.map((ing, index) => (
                                                <tr key={index}>
                                                    <td className="border border-black p-2 text-center">{ing.codart}</td>
                                                    <td className="border border-black p-2 text-center">{ing.desart}</td>
                                                    <td className="border border-black p-2 text-center">
                                                        {ing.merma && !isNaN(Number(ing.merma))
                                                            ? `${(Number(ing.merma) * 100).toFixed(0)}%`
                                                            : "0%"}
                                                    </td>
                                                    <td className="border border-black p-2 text-center">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="text-black p-1 border border-gray-300 rounded text-center"
                                                            value={
                                                                ing.teorica !== undefined &&
                                                                    ing.teorica !== null &&
                                                                    ing.teorica !== "" &&
                                                                    !isNaN(Number(ing.teorica))
                                                                    ? Number(ing.teorica)
                                                                    : ""
                                                            }
                                                            onChange={(e) =>
                                                                handleChange(index, "teorica", e.target.value)
                                                            }
                                                            disabled={!canEdit}
                                                        />
                                                    </td>
                                                    <td className="border border-black p-2 text-center">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="text-black p-1 border border-gray-300 rounded text-center"
                                                            value={
                                                                ing.validar !== undefined &&
                                                                    ing.validar !== null &&
                                                                    !isNaN(Number(ing.validar))
                                                                    ? Number(ing.validar)
                                                                    : ""
                                                            }
                                                            onChange={(e) =>
                                                                handleChange(index, "validar", e.target.value)
                                                            }
                                                            disabled={!canEdit}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <br />
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Botones */}
                    <div className="flex justify-center space-x-4 mt-4">
                        <Button onClick={() => {
                            resetForm();
                            setIsOpen(false);
                        }} variant="cancel" label="Cancelar" />
                        {canEdit && (
                            <Button onClick={handleSubmit} variant="save" label="Guardar" />
                        )}
                    </div>
                </ModalSection>
            )}

            <Table
                columns={["client_name", "number_order"]}
                rows={adaptation}
                columnLabels={{
                    client_name: "Cliente",
                    number_order: "N° Orden",
                }}
                onDelete={canEdit ? ((id: number) => { handleDelete(id); }) : undefined}
                onEdit={(id: number) => { handleEdit(id); }}
                onHistory={(id: number) => { handleHistory(id); }}
            />
            {auditList.length > 0 && (
                <AuditModal audit={auditList} onClose={() => setAuditList([])} />
            )}
        </div>
    );
}

export default NewAdaptation;
