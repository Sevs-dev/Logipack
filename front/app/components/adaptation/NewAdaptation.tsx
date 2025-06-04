import React, { useState, useEffect, useMemo } from "react";
import { ClipboardCopy } from 'lucide-react';
// 🔹 Servicios
import { getClients, getClientsId } from "@/app/services/userDash/clientServices";
import { getFactory } from "@/app/services/userDash/factoryServices";
import { getPrefix } from "@/app/services/consecutive/consecutiveServices";
import { getArticleByCode, getArticleByClient } from "@/app/services/bom/articleServices";
import { newAdaptation, getAdaptations, deleteAdaptation, updateAdaptation, getAdaptationsId } from "@/app/services/adaptation/adaptationServices";
import { getMaestra } from "../../services/maestras/maestraServices";
// 🔹 Componentes
import Button from "../buttons/buttons";
import File from "../buttons/FileButton";
import MultiSelect from "../dinamicSelect/MultiSelect";
import Table from "../table/Table";
import Text from "../text/Text";
import ModalSection from "../modal/ModalSection";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
// 🔹 Toastr
import { showSuccess, showError } from "../toastr/Toaster";
// 🔹 Interfaces
import { Client, Article, Ingredient } from "@/app/interfaces/BOM";
import { Data } from "@/app/interfaces/NewMaestra";
import { BOM, Adaptation, ArticleFormData, Plant } from "@/app/interfaces/NewAdaptation";

function NewAdaptation({ canEdit = false, canView = false }: CreateClientProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<string>("");
    const [plantas, setPlantas] = useState<Plant[]>([]);
    const [planta, setPlanta] = useState<string>('');
    const [, setConsecutivo] = useState<string | null>(null);
    const [client_order, setClientOrder] = useState<string>("");
    const [orderNumber, setOrderNumber] = useState<string>("");
    const [deliveryDate, setDeliveryDate] = useState<string>("");
    const [selectedArticles, setSelectedArticles] = useState<Article[]>([]);
    const [lot, setLot] = useState<string>("");
    const [healthRegistration, setHealthRegistration] = useState<string>("");
    const [quantityToProduce, setQuantityToProduce] = useState("");
    const [attachment, setAttachment] = useState<File | null>(null);
    const [, setAttachmentUrl] = useState<string | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [maestra, setMaestra] = useState<Data[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [adaptation, setAdaptation] = useState<Adaptation[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editAdaptationId, setEditAdaptationId] = useState<number | null>(null);
    const [selectedMaestras, setSelectedMaestras] = useState<string[]>([]);
    const [boms, setBoms] = useState<BOM[]>([]);
    const [selectedBom, setSelectedBom] = useState<number | "">("");
    const [isLoading, setIsLoading] = useState(false);
    const [articleFields, setArticleFields] = useState<Record<string, ArticleFormData>>({});

    // Ejecutar al montar el componente
    useEffect(() => {
        if (canView) {
            fetchAdaptations();
        } // Llamamos a la función para cargar las adaptaciones
    }, [canView]);

    useEffect(() => {
        // Función asincrónica para obtener los clientes
        const fetchClients = async () => {
            try {
                // Inicia el estado de carga
                setIsLoading(true);
                // Obtiene los datos de los clientes
                const clientsData = await getClients();
                setClients(clientsData); // Almacena los clientes en el estado
            } catch (error) {
                // Muestra un error si algo falla al cargar los clientes
                showError("Error al cargar los clientes.");
                console.error(error); // Muestra el error en consola para depuración
            } finally {
                // Finaliza el estado de carga independientemente de si hubo error o no
                setIsLoading(false);
            }
        };
        // Llama a la función para cargar los clientes
        fetchClients();
    }, []); // Este efecto solo se ejecuta una vez cuando el componente se monta

    // Cargar plantas (factories) al montar el componente
    useEffect(() => {
        // Función asincrónica para obtener las plantas
        const fetchFactories = async () => {
            try {
                // Inicia el estado de carga
                setIsLoading(true);
                // Obtiene los datos de las plantas
                const factoriesData: Plant[] = await getFactory(); // Asegúrate de tipar correctamente la respuesta
                setPlantas(factoriesData); // Almacena las plantas en el estado
            } catch (error) {
                // Muestra un error si algo falla al cargar las plantas
                showError("Error al cargar las plantas.");
                console.error(error); // Muestra el error en consola para depuración
            } finally {
                // Finaliza el estado de carga independientemente de si hubo error o no
                setIsLoading(false);
            }
        };
        // Llama a la función para cargar las plantas
        fetchFactories();
    }, []); // Este efecto solo se ejecuta una vez cuando el componente se monta

    // Maneja el cambio de planta seleccionada
    const handlePlantaChange = async (value: string) => {
        // Actualiza el estado de la planta seleccionada
        setPlanta(value);
        // Busca la planta seleccionada a partir de la lista de plantas
        const selectedPlant = plantas.find(p => p.id.toString() === value);
        // Si se encuentra la planta y tiene un prefijo, obtiene el consecutivo
        if (selectedPlant && selectedPlant.prefix) {
            try {
                // Llama a la API para obtener el consecutivo con el prefijo de la planta
                const response = await getPrefix(selectedPlant.prefix);
                // Si la respuesta es válida y tiene consecutivos, establece el consecutivo
                if (response && response.consecutives?.length > 0) {
                    const cons = response.consecutives[0]; // Tomamos el primer consecutivo
                    setConsecutivo(cons); // Establece el consecutivo

                    // Arma el string del orden con el formato adecuado
                    const formattedOrder = `${cons.prefix}-${cons.year}-${cons.month}-${cons.consecutive}`;
                    setClientOrder(formattedOrder); // Establece el número de orden
                }
            } catch (error) {
                // Muestra el error si algo falla al obtener el consecutivo
                console.error("Error al obtener el consecutivo:", error);
            }
        }
    };

    // Copiar el número de orden al portapapeles
    const copyToClipboard = () => {
        // Si hay un número de orden, lo copia al portapapeles
        if (client_order) {
            navigator.clipboard.writeText(client_order); // Copia al portapapeles
            showSuccess('Orden copiada al portapapeles'); // Muestra mensaje de éxito
        }
    };

    // Cargar Maestras al montar el componente
    useEffect(() => {
        // Función asincrónica para obtener las maestras
        const fetchMaestras = async () => {
            try {
                // Inicia el estado de carga
                setIsLoading(true);
                // Obtiene los datos de las maestras
                const maestrasData = await getMaestra();
                setMaestra(maestrasData); // Almacena las maestras en el estado
            } catch (error) {
                // Muestra un error si algo falla al cargar las maestras
                showError("Error al cargar las maestras.");
                console.error(error); // Muestra el error en consola para depuración
            } finally {
                // Finaliza el estado de carga independientemente de si hubo error o no
                setIsLoading(false);
            }
        };

        // Llama a la función para cargar las maestras
        fetchMaestras();
    }, []); // Este efecto solo se ejecuta una vez cuando el componente se monta

    // Cargar artículos disponibles basados en el cliente seleccionado
    useEffect(() => {
        // Si no se ha seleccionado un cliente, no hacer nada
        if (!selectedClient) return;

        // Función asincrónica para obtener los artículos basados en el cliente
        const fetchArticles = async () => {
            try {
                // Inicia el estado de carga
                setIsLoading(true);

                // 1. Obtener datos del cliente por su ID
                const clientData = await getClientsId(Number(selectedClient));
                if (!clientData || !clientData.code) {
                    showError("Código de cliente no disponible.");
                    console.error("Error: clientData o clientData.code es inválido", clientData);
                    return;
                }

                // 2. Obtener artículos usando el código del cliente
                const articlesData = await getArticleByCode(clientData.code);
                setArticles(articlesData.data); // Almacena los artículos en el estado
            } catch (error) {
                // Muestra un error si algo falla al cargar los artículos
                showError("Error al cargar los artículos.");
                console.error("Error en fetchArticles:", error); // Muestra el error en consola para depuración
            } finally {
                // Finaliza el estado de carga independientemente de si hubo error o no
                setIsLoading(false);
            }
        };
        // Llama a la función para cargar los artículos
        fetchArticles();
    }, [selectedClient]); // Este efecto depende de `selectedClient`, se ejecuta cada vez que cambia

    // Nuevo useEffect para asignar los artículos seleccionados cuando `articles` esté listo
    useEffect(() => {
        // Si hay artículos disponibles y artículos seleccionados
        if (articles.length > 0 && selectedArticles.length > 0) {
            // Filtra los artículos seleccionados de la lista de artículos disponibles
            const selectedArticlesFormatted = articles.filter(article =>
                selectedArticles.some(selected => selected.codart === article.codart)
            );
            // Solo actualiza los artículos seleccionados si hay cambios
            setSelectedArticles(prev =>
                JSON.stringify(prev) !== JSON.stringify(selectedArticlesFormatted)
                    ? selectedArticlesFormatted
                    : prev
            );
        }
    }, [articles]); // 👈 Este efecto solo depende de `articles`, elimina `selectedArticles` de las dependencias

    // Cargar BOM (Bill of Materials) si el cliente y las maestras son válidas
    useEffect(() => {
        // Si no hay cliente seleccionado o no hay maestras, no hacer nada
        if (!selectedClient || selectedMaestras.length === 0) return;
        // Busca la maestra seleccionada
        const selectedMaestraObj = maestra.find(
            (m) => m.id.toString() === selectedMaestras[0]
        );
        // Si la maestra no requiere BOM, limpia las listas de BOM e ingredientes
        if (!selectedMaestraObj?.requiere_bom) {
            setBoms([]); // Limpia los BOMs
            setIngredients([]); // Limpia los ingredientes
            return;
        }
        // Función asincrónica para obtener los BOM e ingredientes
        const fetchBom = async () => {
            try {
                // Obtiene los datos del cliente por su ID
                const clientData = await getClientsId(Number(selectedClient));
                // Obtiene los datos del BOM usando el ID del cliente
                const bomData = await getArticleByClient(clientData.id);
                // Si hay BOMs disponibles, los almacena en el estado
                if (bomData?.boms?.length > 0) {
                    setBoms(bomData.boms);
                    // Procesa los ingredientes del primer BOM
                    const ingredientsJSON = bomData.boms[0].ingredients;
                    const parsedIngredients: Ingredient[] = JSON.parse(ingredientsJSON);

                    setIngredients(parsedIngredients); // Almacena los ingredientes en el estado
                } else {
                    setBoms([]); // Limpia los BOMs si no hay datos
                    setIngredients([]); // Limpia los ingredientes si no hay datos
                }
            } catch (error) {
                // Muestra un error si algo falla al obtener los BOMs o ingredientes
                console.error("Error al obtener los BOMs", error);
                setBoms([]); // Limpia los BOMs en caso de error
                setIngredients([]); // Limpia los ingredientes en caso de error
            }
        };
        // Llama a la función para cargar los BOMs y los ingredientes
        fetchBom();
    }, [selectedClient, selectedMaestras, maestra]); // Este efecto depende de `selectedClient`, `selectedMaestras`, y `maestra`

    // Efecto que recalcula la cantidad teórica de ingredientes cada vez que cambia `quantityToProduce`
    useEffect(() => {

        // Si no hay cantidad a producir o si los ingredientes están vacíos, salimos del efecto
        if (quantityToProduce != "") {
            // Convierte la cantidad a producir a un número
            const quantityToProduceNumber = Number(quantityToProduce);

            // Si no hay ingredientes o la cantidad no es un número válido, no se hace nada
            if (!ingredients.length || isNaN(quantityToProduceNumber)) return;
            // Recalcular la cantidad teórica de cada ingrediente
            const recalculated = ingredients.map((ing) => {
                const merma = parseFloat(ing.merma); // Convierte la merma a un número decimal
                // Calcula la cantidad teórica por unidad, considerando la merma
                const teoricaPorUnidad = quantityToProduceNumber + quantityToProduceNumber * merma;
                // Redondea a 4 decimales
                const teoricaCalculada = (teoricaPorUnidad).toFixed(4);
                // Devuelve el ingrediente con la cantidad teórica recalculada
                return {
                    ...ing,
                    teorica: teoricaCalculada,
                };
            });
            // Actualiza el estado de los ingredientes con los valores recalculados
            setIngredients(recalculated);
        }
    }, [quantityToProduce]); // Este efecto se ejecuta cada vez que cambia `quantityToProduce`

    // UseMemo para obtener la maestra seleccionada, solo se recalcula si cambian `selectedMaestras` o `maestra`
    const maestraSeleccionada = useMemo(() => {
        // Busca la maestra cuyo ID coincida con el seleccionado
        return maestra.find(m => m.id.toString() === selectedMaestras[0]);
    }, [selectedMaestras, maestra]);

    // Verifica si la maestra seleccionada requiere BOM (Bill of Materials)
    const maestraRequiereBOM = maestraSeleccionada?.requiere_bom ?? false; // Default a `false` si no está definida

    // Función para manejar los cambios en los campos de los ingredientes
    const handleChange = (index: number, field: keyof Ingredient, value: string): void => {
        // Crea una copia del array de ingredientes
        const updated: Ingredient[] = [...ingredients];
        // Actualiza el campo específico del ingrediente en la posición indicada
        updated[index][field] = value;
        // Establece los ingredientes actualizados en el estado
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
                [field]: value
            }
        }));
    };

    // Función para cargar adaptaciones
    const fetchAdaptations = async () => {
        try {
            // Obtenemos las adaptaciones del backend
            const { adaptations }: { adaptations: Adaptation[] } = await getAdaptations();

            // Procesamos cada adaptación para obtener más detalles (como el nombre del cliente)
            const adapData: Adaptation[] = await Promise.all(
                adaptations.map(async (adaptation) => {
                    const clientData = await getClientsId(adaptation.client_id); // Obtenemos los datos del cliente
                    return {
                        ...adaptation,
                        client_name: clientData.name, // Agregamos el nombre del cliente
                        numberOrder: clientData.number_order, // Agregamos el número de orden del cliente
                    };
                })
            );

            // Guardamos las adaptaciones procesadas en el estado
            setAdaptation(adapData);
        } catch (error) {
            // Si ocurre un error, mostramos un mensaje de error
            showError("Error al cargar adaptaciones.");
            console.error(error);
        }
    };

    // Manejo del envío del formulario
    const handleSubmit = async () => {
        // Validaciones para asegurarse de que todos los campos estén completos
        if (!selectedClient) {
            showError("Por favor, selecciona un Cliente.");
            return;
        }
        if (!planta) {
            showError("Por favor, selecciona una Planta.");
            return;
        }
        if (!selectedArticles.length) {
            showError("Por favor, selecciona al menos un artículo.");
            return;
        }
        if (!selectedMaestras.length) {
            showError("Por favor, selecciona al menos una Maestra.");
            return;
        }

        // Inicializamos el objeto que contendrá los datos de los artículos
        let articlesData;
        if (maestraRequiereBOM) {
            // Si la maestra requiere BOM, validamos los campos específicos
            if (!orderNumber) {
                showError("Por favor, ingresa el número de orden.");
                return;
            }
            if (!deliveryDate || !quantityToProduce || !lot || !healthRegistration) {
                showError("Por favor, completa todos los campos del artículo.");
                return;
            }
            // Creamos los datos del artículo con la información obtenida
            articlesData = [
                {
                    codart: selectedArticles[0]?.codart || "",
                    number_order: client_order,
                    orderNumber,
                    deliveryDate,
                    quantityToProduce,
                    lot,
                    healthRegistration,
                },
            ];
        } else {
            // Si no requiere BOM, verificamos que todos los artículos tengan los campos completos
            const hasErrors = selectedArticles.some((article) => {
                const fields = articleFields[article.codart] || {};
                if (
                    !fields.orderNumber ||
                    !fields.deliveryDate ||
                    !fields.quantityToProduce ||
                    !fields.lot ||
                    !fields.healthRegistration
                ) {
                    console.error(`Faltan datos en el artículo ${article.codart}.`, fields);
                    showError(`Faltan datos en el artículo ${article.codart}.`);
                    return true;
                }
                return false;
            });
            if (hasErrors) return;
            // Creamos los datos de los artículos
            articlesData = selectedArticles.map((article) => {
                const fields = articleFields[article.codart];
                return {
                    codart: article.codart,
                    number_order: client_order,
                    orderNumber: fields.orderNumber,
                    deliveryDate: fields.deliveryDate,
                    quantityToProduce: fields.quantityToProduce,
                    lot: fields.lot,
                    healthRegistration: fields.healthRegistration,
                };
            });
        }
        // Preparamos el FormData para enviar al backend
        const formData = new FormData();
        formData.append("client_id", selectedClient.toString());
        formData.append("factory_id", planta.toString());
        formData.append("article_code", JSON.stringify(articlesData));
        formData.append("number_order", client_order);
        formData.append("orderNumber", orderNumber);
        formData.append("master", selectedMaestras.toString());
        formData.append("bom", selectedBom.toString() || "");
        formData.append("ingredients", JSON.stringify(ingredients));
        // Adjuntamos los archivos si es necesario
        if (maestraRequiereBOM) {
            if (attachment) {
                formData.append("attachment", attachment);
            }
        } else {
            selectedArticles.forEach((article) => {
                const file = articleFields[article.codart]?.attachment;
                if (file) {
                    formData.append(`attachment_${article.codart}`, file);
                }
            });
        }
        // Mostramos los datos que se van a enviar (solo para depuración)
        console.log("🧾 Datos a guardar:", {
            client_id: selectedClient,
            plant_id: planta,
            article_code: articlesData,
            number_order: client_order,
            orderNumber,
            master: selectedMaestras,
            bom: selectedBom,
            ingredients,
        });
        // Intentamos guardar los datos en el backend
        try {
            setIsLoading(true); // Indicamos que la carga está en progreso
            if (isEditMode) {
                // Si estamos en modo edición, actualizamos la adaptación
                await updateAdaptation(editAdaptationId!, formData);
                showSuccess("Acondicionamiento actualizado.");
            } else {
                // Si estamos creando una nueva adaptación, la guardamos
                await newAdaptation(formData);
                showSuccess("Acondicionamiento creado.");
            }
            resetForm(); // Reiniciamos el formulario
            setIsOpen(false); // Cerramos el modal
            const { adaptations } = await getAdaptations();
            setAdaptation(adaptations); // Refrescamos la lista de adaptaciones
            fetchAdaptations(); // Llamamos de nuevo a fetchAdaptations para asegurar que esté actualizada
        } catch (error: any) {
            // Si ocurre un error al guardar, mostramos un mensaje de error
            showError("Error al guardar.");
            console.error("🔥 Error completo:", error);
            if (error?.response) {
                // Mostramos detalles específicos del error
                console.error("🧠 Respuesta del servidor:", error.response.data);
                const details = error.response.data?.details;
                if (details && typeof details === 'object') {
                    Object.entries(details).forEach(([key, value]) => {
                        console.error(`❌ Error en "${key}":`, value);
                    });
                }
            } else {
                console.error("💥 Error sin respuesta del servidor:", error.message);
            }
        } finally {
            // Independientemente del resultado, apagamos el indicador de carga
            setIsLoading(false);
        }
    };

    // Función para cargar los datos de una adaptación para editarla
    const handleEdit = async (id: number) => {
        try {
            // Obtenemos los datos de la adaptación a editar
            const response = await getAdaptationsId(id);
            const adaptation = response.adaptation;
            if (!adaptation) {
                showError("La adaptación no existe");
                return;
            }

            // Logs detallados de campos clave
            // console.log("client_id:", adaptation.client_id);
            // console.log("factory_id:", adaptation.factory_id);
            // console.log("master:", adaptation.master);
            // console.log("bom:", adaptation.bom);
            // console.log("article_code (raw):", adaptation.article_code);
            // console.log("ingredients (raw):", adaptation.ingredients);

            // Configuramos el formulario en modo edición
            setIsEditMode(true);
            setEditAdaptationId(id);

            // Conversión segura con logs
            const clientIdStr = adaptation.client_id?.toString() ?? "";
            setSelectedClient(clientIdStr);

            const plantaStr = adaptation.factory_id?.toString() ?? "";
            setPlanta(plantaStr);

            const masterStr = adaptation.master?.toString() ?? "";
            setSelectedMaestras(masterStr);

            const bomStr = adaptation.bom?.toString() ?? "";
            setSelectedBom(bomStr);

            // Procesamos los artículos
            const parsedArticles = adaptation.article_code
                ? JSON.parse(adaptation.article_code)
                : [];
            setSelectedArticles(parsedArticles.map((a: any) => ({ codart: a.codart })));

            // Procesamos los campos específicos del artículo si es necesario
            setClientOrder(adaptation.number_order || "");

            if (bomStr !== "") {
                const general = parsedArticles[0] || {};
                setOrderNumber(general.orderNumber ?? "");
                setClientOrder(general.client_order ?? adaptation.number_order ?? "");
                setDeliveryDate(formatDate(general.deliveryDate ?? ""));
                setQuantityToProduce(String(general.quantityToProduce ?? ""));
                setLot(general.lot ?? "");
                setHealthRegistration(general.healthRegistration ?? "");
                setAttachment(null);
                setAttachmentUrl(
                    general.attachment ? `/storage/${general.attachment}` : null
                );
                setArticleFields({});
            } else {
                const fieldsMap: Record<string, ArticleFormData> = {};
                parsedArticles.forEach((a: any) => {
                    fieldsMap[a.codart] = {
                        orderNumber: a.orderNumber ?? "",
                        numberOrder: a.client_order ?? "",
                        deliveryDate: formatDate(a.deliveryDate ?? ""),
                        quantityToProduce: a.quantityToProduce ?? "",
                        lot: a.lot ?? "",
                        healthRegistration: a.healthRegistration ?? "",
                        attachment: a.attachment,
                    };
                });
                setArticleFields(fieldsMap);
            }

            // Procesamos los ingredientes si existen
            if (adaptation.ingredients) {
                try {
                    const parsedIng = JSON.parse(adaptation.ingredients).map((ing: any) => ({
                        ...ing,
                        teorica: (Number(ing.quantity || "0") * (1 + Number(ing.merma || "0"))).toFixed(4),
                        validar: ing.validar ?? "",
                    }));
                    setIngredients(parsedIng);
                } catch (e) {
                    setIngredients([]); // Si ocurre un error al parsear los ingredientes, los dejamos vacíos
                }
            } else {
                setIngredients([]); // Si no hay ingredientes, lo dejamos vacío
            }

            setIsOpen(true); // Abrimos el modal para edición
        } catch (error) {
            // Si hay algún error en el proceso de edición, lo mostramos
            showError("Error al cargar la adaptación.");
            console.error(error);
        }
    };

    // Manejo de la eliminación de una adaptación
    const handleDelete = async (id: number) => {
        if (!canEdit) return;
        const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar esta adaptación?");
        if (confirmDelete) {
            try {
                await deleteAdaptation(id); // Llamamos a la función para eliminar la adaptación
                setAdaptation(adaptation.filter((item) => item.id !== id)); // Actualizamos el estado para reflejar la eliminación
            } catch (error) {
                // Si ocurre un error al eliminar, mostramos un mensaje de error
                showError("Error al eliminar la adaptación.");
                console.error(error);
            }
        }
    };

    // Función para formatear las fechas a formato YYYY-MM-DD
    const formatDate = (dateString: string): string => {
        const dt = new Date(dateString);
        if (isNaN(dt.getTime())) return ""; // Si la fecha es inválida, devolvemos una cadena vacía
        return dt.toISOString().slice(0, 10); // Devolvemos la fecha en formato YYYY-MM-DD
    };

    // Resetear el formulario
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

    const visualOrder = client_order.replace(/(\d{7})$/, (match) =>
        String(parseInt(match) + 1).padStart(7, '0')
    );

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
                    <Text type="title">
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
                                    <Text type="subtitle">Planta:</Text>
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
                                    <Text type="subtitle">Cliente:</Text>
                                    <select
                                        className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                        value={selectedClient}
                                        onChange={e => {
                                            setSelectedClient(e.target.value);
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
                                <div className="w-1/2 relative group">
                                    {/* Label con mejor espaciado */}
                                    <Text type="subtitle">Orden:</Text>
                                    {/* Contenedor para input y botón */}
                                    <div className="relative">
                                        {/* Input mejorado */}
                                        <input
                                            type="text"
                                            value={visualOrder}
                                            readOnly
                                            className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 text-gray-800 bg-gray-50 
                                                mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                                text-center pr-12 transition-all duration-200 ease-in-out
                                                cursor-not-allowed"
                                            onCopy={e => e.preventDefault()}
                                            onPaste={e => e.preventDefault()}
                                            onCut={e => e.preventDefault()}
                                            aria-readonly="true"
                                            disabled={!canEdit}
                                        />

                                        {/* Botón con tooltip y mejor posicionamiento */}
                                        <button
                                            type="button"
                                            onClick={copyToClipboard}
                                            className="absolute top-1/2 right-3 transform -translate-y-1/2 
                                                text-gray-400 hover:text-blue-600 transition-colors duration-200 
                                                focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
                                            title="Copiar al portapapeles"
                                        >
                                            <ClipboardCopy size={20} />
                                            {/* Tooltip opcional */}
                                            <span className="absolute hidden group-hover:block -top-8 right-0 
                                                    bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                                Copiar
                                            </span>
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Maestras y BOM*/}
                        <div
                            className={`col-span-full grid grid-cols-1 ${maestraRequiereBOM ? "sm:grid-cols-3" : "lg:grid-cols-1"
                                } gap-4`}
                        >
                            {/* Select de Maestras */}
                            <div>
                                <Text type="subtitle">Maestras:</Text>
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

                            {/* Select de BOM solo si se requiere */}
                            {maestraRequiereBOM && (
                                <div>
                                    <Text type="subtitle">BOM:</Text>
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
                                                    {JSON.parse(bom.code_details)?.codart ?? "Sin código"}
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
                                <Text type="subtitle">Artículos:</Text>
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
                                    <MultiSelect
                                        options={articles}
                                        selected={selectedArticles}
                                        onChange={setSelectedArticles}
                                        getLabel={(article) => article.codart}
                                        getValue={(article) => article.codart}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="flex-[1] flex gap-6 flex-wrap">
                            {/* Campos en grid responsivo */}
                            {maestraRequiereBOM ? (
                                <div className="flex-1 min-w-[250px] border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50 transition-colors">
                                    {/* Número de Orden */}
                                    <div>
                                        <Text type="subtitle">N° Orden del Cliente:</Text>
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
                                        <Text type="subtitle">Fecha Entrega:</Text>
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
                                        <Text type="subtitle">Cantidad a Producir:</Text>
                                        <input
                                            type="number"
                                            className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                            value={quantityToProduce}
                                            onChange={e => setQuantityToProduce(e.target.value)}
                                            min={1}
                                            disabled={!canEdit}
                                        />
                                    </div>
                                    {/* Lote */}

                                    <div>
                                        <Text type="subtitle">Lote:</Text>
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
                                        <Text type="subtitle">Registro Sanitario:</Text>
                                        <input
                                            type="text"
                                            className="w-full border p-3 rounded-lg text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                            value={healthRegistration}
                                            onChange={e => setHealthRegistration(e.target.value)}
                                            disabled={!canEdit}
                                        />
                                    </div>

                                    {/* Adjunto */}
                                    <div className="flex flex-col">
                                        <Text type="subtitle">Adjuntar:</Text>
                                        {canEdit && (
                                            <File onChange={setAttachment} />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-blue-300 p-3 mb-3 rounded-md cursor-grab bg-teal-50 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center">
                                    {selectedArticles.map((article) => (
                                        <div key={article.codart} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                                            <Text type="title">Artículo: {article.codart}</Text>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div className="col-span-1">
                                                    <Text type="subtitle">N° Orden del Cliente:</Text>
                                                    <input
                                                        type="text"
                                                        className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-black"
                                                        value={articleFields[article.codart]?.orderNumber || ""}
                                                        onChange={(e) => handleFieldChange(article.codart, "orderNumber", e.target.value)}
                                                        disabled={!canEdit}
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <Text type="subtitle">Fecha Entrega:</Text>
                                                    <input
                                                        type="date"
                                                        className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-black"
                                                        value={articleFields[article.codart]?.deliveryDate || ""}
                                                        onChange={(e) => handleFieldChange(article.codart, "deliveryDate", e.target.value)}
                                                        disabled={!canEdit}
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <Text type="subtitle">Cant. a Teorica:</Text>
                                                    <input
                                                        type="number"
                                                        className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-black"
                                                        value={articleFields[article.codart]?.quantityToProduce || ""}
                                                        onChange={(e) => handleFieldChange(article.codart, "quantityToProduce", Number(e.target.value))}
                                                        disabled={!canEdit}
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <Text type="subtitle">Lote:</Text>
                                                    <input
                                                        type="text"
                                                        className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-black"
                                                        value={articleFields[article.codart]?.lot || ""}
                                                        onChange={(e) => handleFieldChange(article.codart, "lot", e.target.value)}
                                                        disabled={!canEdit}
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <Text type="subtitle">R. Sanitario:</Text>
                                                    <input
                                                        type="text"
                                                        className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-black"
                                                        value={articleFields[article.codart]?.healthRegistration || ""}
                                                        onChange={(e) => handleFieldChange(article.codart, "healthRegistration", e.target.value)}
                                                        disabled={!canEdit}
                                                    />
                                                </div>
                                                <div className="col-span-1 flex flex-col">
                                                    <Text type="subtitle">Adjuntar:</Text>
                                                    {canEdit && (
                                                        <File
                                                            onChange={(file) => handleFieldChange(article.codart, "attachment", file)}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Materiales */}
                        {maestraRequiereBOM ? (
                            <div className="col-span-full">
                                <Text type="subtitle">Materiales:</Text>
                                <div>
                                    <table className="w-full border-collapse border border-black text-black">
                                        <thead>
                                            <tr className="bg-gray-200">
                                                <th className="border border-black p-2 text-center">Codart</th>
                                                <th className="border border-black p-2 text-center">Desart</th>
                                                <th className="border border-black p-2 text-center">Merma%</th>
                                                <th className="border border-black p-2 text-center">Cantidad Teorica</th>
                                                <th className="border border-black p-2 text-center">Validar </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ingredients.map((ing, index) => (
                                                <tr key={index}>
                                                    <td className="border border-black p-2 text-center">{ing.codart}</td>
                                                    <td className="border border-black p-2 text-center">{ing.desart}</td>
                                                    <td className="border border-black p-2 text-center">
                                                        {(Number(ing.merma) * 100).toFixed(0)}%
                                                    </td>
                                                    <td className="border border-black p-2 text-center">
                                                        <input
                                                            type="number"
                                                            className="text-black p-1 border border-gray-300 rounded text-center"
                                                            value={Number(ing.teorica).toFixed(2)}
                                                            onChange={(e) => handleChange(index, "teorica", e.target.value)}
                                                            disabled={!canEdit}
                                                        />
                                                    </td>
                                                    <td className="border border-black p-2">
                                                        <input
                                                            type="number"
                                                            className="text-black p-1 border border-gray-300 rounded text-center"
                                                            value={ing.validar}
                                                            onChange={(e) => handleChange(index, "validar", e.target.value)}
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
                        ) : (null)}
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end space-x-4 mt-4">
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
                onDelete={canEdit ? handleDelete : undefined}
                onEdit={handleEdit}
            />
        </div>
    );
}

export default NewAdaptation;
