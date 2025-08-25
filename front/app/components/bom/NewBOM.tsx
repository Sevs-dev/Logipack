// React y librerías externas
import React, { useState, useEffect, useMemo } from "react";
// Componentes locales
import Button from "../buttons/buttons";
import Text from "../text/Text";
import Table from "../table/Table";
import { showSuccess, showError, showConfirm } from "../toastr/Toaster";
import ModalSection from "../modal/ModalSection";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
import AuditModal from "../history/AuditModal";

// Servicios
import {
  getClients,
  getClientsId,
} from "@/app/services/userDash/clientServices";
import {
  getArticleByCode,
  newArticle,
  getArticlesId,
  deleteArticle,
  updateArticle,
  getBoms,
} from "@/app/services/bom/articleServices";
import { getAuditsByModel } from "../../services/history/historyAuditServices";

// Tipos e interfaces
import {
  Article,
  Ingredient,
  Bom,
  BomView,
  BomPayload,
} from "@/app/interfaces/BOM";
import { Audit } from "../../interfaces/Audit";
import { Client } from "@/app/interfaces/Client";
import DateLoader from "@/app/components/loader/DateLoader";

// 🆕 helper para uid estable por fila (no usar index como key)
const uid = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

// 🆕 Tipo local solo para la UI (payload seguirá usando Ingredient)
type LocalIngredient = Ingredient & { uid: string };

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
  const [sticker, setSticker] = useState("");
  const [sticker2, setSticker2] = useState("");
  const [ingredients, setIngredients] = useState<LocalIngredient[]>([]);
  const [boms, setBoms] = useState<Bom[]>([]);
  const [bomStatus, setBomStatus] = useState(false); // false = inactivo, true = activo
  const [isSaving, setIsSaving] = useState(false);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [auditList, setAuditList] = useState<Audit[]>([]);
  const [, setSelectedAudit] = useState<Audit | null>(null);
  const [clientQuery, setClientQuery] = useState("");
  const [clientListOpen, setClientListOpen] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showStickers2, setShowStickers2] = useState(false);

  // 🆕 buscador independiente por ingrediente (clave = uid)
  const [ingredientSearch, setIngredientSearch] = useState<
    Record<string, string>
  >({});

  const filteredArticles = useMemo(() => {
    if (!searchTerm.trim()) return articles;
    return articles.filter(
      (article) =>
        article.desart.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.codart.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [articles, searchTerm]);

  // Cargar clientes al montar el componente
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientsData = await getClients();
        setClients(clientsData);
      } catch (error) {
        showError("Error al cargar los clientes.");
        console.error(error);
      }
    };
    fetchClients();
  }, []);

  // Cargar BOMs y asociar nombre del cliente y datos del artículo
  const fetchBOMs = async () => {
    try {
      const data = await getBoms();
      const bomsData: Bom[] = Array.isArray(data) ? data : [];
      const bomsWithExtra: BomView[] = await Promise.all(
        bomsData.map(async (bom) => {
          const clientData = await getClientsId(bom.client_id);
          let article_codart = "";
          let article_desart = "";
          if (bom.details) {
            try {
              const detailsObj = JSON.parse(bom.details);
              if (detailsObj.article) {
                article_codart = detailsObj.article.codart || "";
                article_desart = detailsObj.article.desart || "";
              }
            } catch (error) {
              console.error("Error parseando details:", error);
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
      setBoms(bomsWithExtra);
    } catch (error) {
      showError("Error al cargar los BOMs.");
      console.error(error);
    }
  };

  useEffect(() => {
    if (canView) {
      fetchBOMs();
    }
  }, [canView]);

  // Cargar datos para edición si se abre el modal y hay un BOM seleccionado
  useEffect(() => {
    if (currentBomId && isModalOpen) {
      (async () => {
        try {
          const data = await getArticlesId(currentBomId);
          const bom = data.bom;
          if (!bom) {
            showError("No se encontró el BOM para edición.");
            return;
          }
          const clientData = await getClientsId(bom.client_id);

          setSelectedClient(clientData.id.toString());
          setBaseQuantity(Number(bom.base_quantity));
          setBomStatus(bom.status);
          const articleData =
            bom.details && bom.details !== "undefined" && bom.details !== null
              ? JSON.parse(bom.details).article
              : null;
          setSelectedArticle(articleData);

          // 🆕 al cargar ingredientes, anexar uid por fila y limpiar buscadores
          const ingr: Ingredient[] =
            bom.ingredients &&
            bom.ingredients !== "undefined" &&
            bom.ingredients !== null
              ? JSON.parse(bom.ingredients)
              : [];

          const ingrWithUid: LocalIngredient[] = ingr.map((it) => ({
            ...it,
            uid: uid(),
          }));

          setIngredients(ingrWithUid);
          setIngredientSearch(
            ingrWithUid.reduce<Record<string, string>>((acc, it) => {
              acc[it.uid] = "";
              return acc;
            }, {})
          );
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
    const client = clients.find((c) => c.id.toString() === selectedClient);
    if (!client) return;

    const loadData = async () => {
      setLoadingArticles(true);
      try {
        const articlesData = await getArticleByCode(client.code as string);
        console.log(articlesData);

        let fetchedArticles: Article[] = articlesData?.data || [];
        setAllArticles(fetchedArticles);
        if (selectedArticle) {
          fetchedArticles = fetchedArticles.filter(
            (a) => a.codart !== selectedArticle.codart
          );
        }
        setArticles(fetchedArticles);
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
      setIngredientSearch({});
      setBomStatus(false);
    }
  }, [selectedClient, currentBomId]);

  // Seleccionar artículo principal
  const handleSelectArticle = (article: Article) => {
    if (selectedArticle) {
      showError(
        "Ya has seleccionado un artículo. Elimina el actual para seleccionar otro."
      );
      return;
    }
    setSelectedArticle(article);
    setArticles((prev) => prev.filter((a) => a.codart !== article.codart));
  };

  // Deseleccionar artículo principal
  const handleDeselectArticle = () => {
    if (selectedArticle) {
      setArticles((prev) => [...prev, selectedArticle]);
      setSelectedArticle(null);
    }
  };

  // Cambiar campo de ingrediente
  const handleIngredientChange = (
    index: number,
    field: keyof Ingredient,
    value: string
  ) => {
    setIngredients((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // 🆕 Agregar fila de ingrediente con uid y search vacío
  const addIngredientRow = () => {
    const row: LocalIngredient = {
      uid: uid(),
      codart: "",
      desart: "",
      quantity: "",
      merma: "",
      teorica: "",
    };
    setIngredients((prev) => [...prev, row]);
    setIngredientSearch((prev) => ({ ...prev, [row.uid]: "" }));
  };

  // 🆕 Quitar fila y limpiar su buscador
  const removeIngredientRow = (index: number) => {
    setIngredients((prev) => {
      const copy = [...prev];
      const removed = copy.splice(index, 1)[0];
      if (removed) {
        setIngredientSearch((s) => {
          const rest = Object.fromEntries(
            Object.entries(s).filter(([key]) => key !== removed.uid)
          );
          return rest;
        });
      }
      return copy;
    });
  };

  // Guardar o actualizar BOM
  const handleSaveBOM = async () => {
    if (!selectedClient || !selectedArticle) {
      showError("Debes seleccionar un cliente y un artículo.");
      return;
    }

    const hasAtLeastOneIngredient = ingredients.some((i) => i.codart?.trim());
    if (!hasAtLeastOneIngredient) {
      showError("Agrega al menos un ingrediente válido.");
      return;
    }

    setIsSaving(true);

    try {
      const code_details = JSON.stringify({ codart: selectedArticle.codart });

      const code_ingredients = JSON.stringify(
        ingredients
          .filter((ing) => ing.codart?.trim())
          .map((ing) => ({ codart: ing.codart }))
      );

      const cleanIngredients: Ingredient[] = ingredients
        .filter((ing) => ing.codart?.trim())
        .map((ing) => {
          /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
          const { uid, ...rest } = ing;

          const parseNum = (v: unknown): string => {
            const n = parseFloat(String(v ?? "").replace(",", "."));
            return Number.isFinite(n) ? String(n) : "0";
          };

          return {
            ...rest,
            quantity: parseNum(rest.quantity),
            merma: parseNum(rest.merma),
            teorica: rest.teorica ?? "",
          };
        });

      const bomPayload: BomPayload = {
        client_id: Number(selectedClient),
        base_quantity: String(baseQuantity ?? 0),
        details: JSON.stringify({ article: selectedArticle }),
        code_details,
        ingredients: JSON.stringify(cleanIngredients),
        code_ingredients,
        status: bomStatus,
        sticker, // <-- guardar
        sticker2,
      };

      if (currentBomId) {
        await updateArticle(currentBomId, bomPayload);
        showSuccess("BOM actualizado con éxito");
      } else {
        await newArticle(bomPayload);
        showSuccess("BOM creado con éxito");
      }

      resetForm();
      fetchBOMs();
    } catch (error) {
      showError("Error al guardar el BOM.");
      console.error("Error en handleSaveBOM:", error);
    } finally {
      setIsSaving(false);
      setIsModalOpen(false);
    }
  };

  // Reiniciar todos los campos del formulario
  const resetForm = () => {
    setSelectedClient("");
    setSelectedArticle(null);
    setIngredients([]);
    setIngredientSearch({});
    setBaseQuantity(0);
    setBomStatus(false);
    setSticker("");
    setSticker2("");
    setCurrentBomId(null);
  };

  // Editar BOM existente
  const handleEdit = async (id: number) => {
    try {
      const data = await getArticlesId(id);
      const bom = data.bom;

      if (!bom) {
        showError("No se encontró una BOM válida para este artículo.");
        return;
      }

      const clientData = await getClientsId(bom.client_id);

      setSelectedClient(clientData.id.toString());
      setCurrentBomId(bom.id);
      setBaseQuantity(Number(bom.base_quantity));
      setBomStatus(bom.status);
      setSticker(bom.sticker ?? "");
      setSticker2(bom.sticker2 ?? "");

      const articleData =
        bom.details && bom.details !== "undefined"
          ? JSON.parse(bom.details).article
          : null;
      setSelectedArticle(articleData);

      const ingr: Ingredient[] =
        bom.ingredients && bom.ingredients !== "undefined"
          ? JSON.parse(bom.ingredients)
          : [];

      const ingrWithUid: LocalIngredient[] = ingr.map((it) => ({
        ...it,
        uid: uid(),
      }));
      setIngredients(ingrWithUid);
      setIngredientSearch(
        ingrWithUid.reduce<Record<string, string>>((acc, it) => {
          acc[it.uid] = "";
          return acc;
        }, {})
      );

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
        fetchBOMs();
      } catch (error) {
        console.error("Error al eliminar BOM:", error);
        showError("Error al eliminar BOM");
      }
    });
  };

  // Seleccionar ingrediente desde lista de artículos
  const handleIngredientSelect = (index: number, selectedCodart: string) => {
    const selectedArticleForIngredient = allArticles.find(
      (article) => article.codart === selectedCodart
    );
    if (selectedArticleForIngredient) {
      setIngredients((prev) => {
        const copy = [...prev];
        copy[index] = {
          ...copy[index],
          codart: selectedArticleForIngredient.codart,
          desart: selectedArticleForIngredient.desart,
        };
        return copy;
      });
    }
  };

  //Gistorial
  const handleHistory = async (id: number) => {
    const model = "Bom";
    try {
      const data = await getAuditsByModel(model, id);
      setAuditList(data);
      if (data.length > 0) setSelectedAudit(data[0]);
    } catch (error) {
      console.error("Error al obtener la auditoría:", error);
    }
  };

  //Filtro
  const filteredClientsByQuery = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        String(c.code ?? "")
          .toLowerCase()
          .includes(q) ||
        String(c.id).includes(q)
    );
  }, [clientQuery, clients]);

  return (
    <div className="space-y-6">
      {/* Acciones superiores */}
      <div className="flex justify-center">
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

      {/* Loader */}
      {isSaving && (
        <DateLoader
          message="Cargando..."
          backgroundColor="rgba(0, 0, 0, 0.28)"
          color="rgba(255, 255, 0, 1)"
        />
      )}

      {/* Modal */}
      {isModalOpen && (
        <ModalSection
          isVisible={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        >
          {/* Contenedor con header y footer fijos */}
          <div className=" flex flex-col">
            {/* Header modal */}
            <div className=" bg-white border-b border-gray-200 px-2 sm:px-4 py-3">
              <Text type="title" color="text-[#000]">
                {currentBomId ? "Editar BOM" : "Crear BOM"}
              </Text>
            </div>

            {/* Body scrollable */}
            <div className="px-2 sm:px-4 py-4 space-y-6 overflow-y-auto">
              {/* Cliente */}
              <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                <Text type="subtitle" color="#000">
                  Selecciona un Cliente
                </Text>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por nombre, código o ID…"
                    value={clientQuery}
                    onChange={(e) => {
                      setClientQuery(e.target.value);
                      setClientListOpen(true);
                    }}
                    onFocus={() => setClientListOpen(true)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black text-base text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!canEdit}
                    aria-label="Buscador de clientes"
                  />

                  {clientListOpen && (
                    <div
                      className="absolute left-0 right-0 z-20 mt-1 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl scrollbar-thin"
                      onMouseLeave={() => setClientListOpen(false)}
                    >
                      {filteredClientsByQuery.length > 0 ? (
                        filteredClientsByQuery.map((client) => (
                          <button
                            type="button"
                            key={client.id}
                            className={`w-full px-4 py-3 text-black text-left text-base transition ${
                              selectedClient === String(client.id)
                                ? "bg-blue-100"
                                : "hover:bg-blue-50"
                            }`}
                            onClick={() => {
                              setSelectedClient(String(client.id));
                              setClientQuery(
                                `${client.name} (${client.code ?? client.id})`
                              );
                              setClientListOpen(false);
                            }}
                            disabled={!canEdit}
                            title={client.name}
                          >
                            <div className="font-medium truncate">
                              {client.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              Código: {client.code ?? "—"} · ID: {client.id}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-600">
                          Sin coincidencias.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    Seleccionado:{" "}
                    {selectedClient
                      ? (() => {
                          const c = clients.find(
                            (x) => String(x.id) === selectedClient
                          );
                          return c ? `${c.name} (${c.code ?? c.id})` : "—";
                        })()
                      : "—"}
                  </span>

                  {selectedClient && canEdit && (
                    <button
                      type="button"
                      className="ml-auto bg-red-500 hover:bg-red-400 text-white text-xs px-2 py-1 rounded"
                      onClick={() => {
                        setSelectedClient("");
                        setClientQuery("");
                      }}
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </section>

              {/* Artículos */}
              {(selectedClient || currentBomId) && (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lista */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
                    <Text type="subtitle" color="#000">
                      Artículos Disponibles
                    </Text>

                    <input
                      type="text"
                      placeholder="Buscar artículos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border border-gray-300 rounded-lg p-2.5 w-full text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!canEdit}
                      aria-label="Buscador de artículos"
                    />

                    {loadingArticles ? (
                      <p className="text-blue-500">Cargando artículos...</p>
                    ) : filteredArticles.length > 0 ? (
                      <ul className="border border-gray-200 rounded-lg bg-gray-50 h-48 overflow-y-auto divide-y divide-gray-200 scrollbar-thin">
                        {filteredArticles.map((article) => (
                          <li
                            key={article.codart}
                            className={`px-3 py-2 text-black cursor-pointer transition ${
                              canEdit
                                ? "hover:bg-blue-100"
                                : "text-gray-400 cursor-not-allowed"
                            }`}
                            onClick={() => {
                              if (canEdit) handleSelectArticle(article);
                            }}
                            title={
                              !canEdit
                                ? "No tienes permiso para seleccionar artículos"
                                : ""
                            }
                          >
                            <span className="font-medium">
                              {article.desart}
                            </span>{" "}
                            <span className="text-gray-600">
                              ({article.codart})
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-600">
                        No se encontraron coincidencias.
                      </div>
                    )}
                  </div>

                  {/* Seleccionado */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
                    <Text type="subtitle" color="#000">
                      Artículo Seleccionado
                    </Text>
                    {selectedArticle ? (
                      <div className="border border-gray-200 rounded-lg bg-gray-50 px-3 py-2 flex items-center gap-3">
                        <span className="text-black truncate">
                          {selectedArticle.desart} ({selectedArticle.codart})
                        </span>
                        <button
                          onClick={handleDeselectArticle}
                          className="ml-auto bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                          disabled={!canEdit}
                          aria-label="Quitar artículo seleccionado"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <Text type="alert">
                        No se ha seleccionado ningún artículo.
                      </Text>
                    )}
                  </div>
                </section>
              )}

              {/* Config básica + Ingredientes */}
              {selectedArticle && (
                <>
                  {/* Config básica */}
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-2">
                      <Text type="subtitle" color="#000">
                        Cantidad Base
                      </Text>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0"
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-black text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={baseQuantity === 0 ? "" : baseQuantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBaseQuantity(val === "" ? 0 : Number(val));
                        }}
                        disabled={!canEdit}
                      />
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-2">
                      <Text type="subtitle" color="#000">
                        Estado
                      </Text>
                      <select
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-black text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={bomStatus ? "activo" : "inactivo"}
                        onChange={(e) =>
                          setBomStatus(e.target.value === "activo")
                        }
                        disabled={!canEdit}
                      >
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    </div>
                  </section>

                  {/* Ingredientes */}
                  <section className="space-y-4">
                    <Text type="subtitle" color="text-gray-800">
                      Materiales
                    </Text>

                    {ingredients.length > 0 ? (
                      <>
                        {ingredients.map((ing, index) => {
                          const term = ingredientSearch[ing.uid] ?? "";
                          const rowFilteredArticles = allArticles.filter(
                            (article) =>
                              article.desart
                                .toLowerCase()
                                .includes(term.toLowerCase()) ||
                              article.codart
                                .toLowerCase()
                                .includes(term.toLowerCase())
                          );

                          return (
                            <div
                              key={ing.uid}
                              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Buscador y lista */}
                                <div className="md:col-span-2 space-y-2">
                                  <Text type="subtitle" color="#000">
                                    Buscar artículo
                                  </Text>
                                  <input
                                    type="text"
                                    placeholder="Nombre o código del artículo..."
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={term}
                                    onChange={(e) =>
                                      setIngredientSearch((prev) => ({
                                        ...prev,
                                        [ing.uid]: e.target.value,
                                      }))
                                    }
                                    disabled={!canEdit}
                                  />

                                  <div className="mt-3 max-h-56 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white scrollbar-thin">
                                    {rowFilteredArticles.length > 0 ? (
                                      rowFilteredArticles.map((article) => (
                                        <label
                                          key={article.codart}
                                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-black transition ${
                                            ing.codart === article.codart
                                              ? "bg-blue-100 font-medium"
                                              : "hover:bg-blue-50"
                                          }`}
                                        >
                                          <input
                                            type="radio"
                                            name={`article-${ing.uid}`}
                                            className="accent-blue-600"
                                            value={article.codart}
                                            checked={
                                              !!(ing.codart === article.codart)
                                            }
                                            onChange={() =>
                                              handleIngredientSelect(
                                                index,
                                                article.codart
                                              )
                                            }
                                            disabled={!canEdit}
                                          />
                                          <span className="truncate">
                                            {article.desart} ({article.codart})
                                          </span>
                                        </label>
                                      ))
                                    ) : (
                                      <div className="p-4 text-sm text-gray-500">
                                        No se encontraron artículos.
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Cantidades y acción */}
                                <div className="space-y-3">
                                  <div>
                                    <Text type="subtitle" color="#000">
                                      Cantidad
                                    </Text>
                                    <input
                                      type="number"
                                      min="0"
                                      step="any"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="0"
                                      value={ing.quantity}
                                      onChange={(e) =>
                                        handleIngredientChange(
                                          index,
                                          "quantity",
                                          e.target.value
                                        )
                                      }
                                      disabled={!canEdit}
                                    />
                                  </div>

                                  <div>
                                    <Text type="subtitle" color="#000">
                                      % Merma
                                    </Text>
                                    <input
                                      type="number"
                                      min="0"
                                      step="any"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="0"
                                      value={ing.merma}
                                      onChange={(e) =>
                                        handleIngredientChange(
                                          index,
                                          "merma",
                                          e.target.value
                                        )
                                      }
                                      disabled={!canEdit}
                                    />
                                  </div>

                                  {/* Cálculo neto */}
                                  {(() => {
                                    const qty =
                                      parseFloat(
                                        String(ing.quantity ?? "").replace(
                                          ",",
                                          "."
                                        )
                                      ) || 0;
                                    const rawWaste =
                                      parseFloat(
                                        String(ing.merma ?? "").replace(
                                          ",",
                                          "."
                                        )
                                      ) || 0;
                                    const waste = Math.min(
                                      100,
                                      Math.max(0, rawWaste)
                                    );
                                    const net = qty * (1 - waste / 100);

                                    return (
                                      <div className="text-sm text-gray-700">
                                        Neta:{" "}
                                        <span className="font-semibold">
                                          {net.toFixed(3)}
                                        </span>{" "}
                                        <span className="opacity-70">
                                          ({qty.toFixed(3)} × (1 −{" "}
                                          {waste.toFixed(2)}
                                          %))
                                        </span>
                                      </div>
                                    );
                                  })()}

                                  <div className="pt-1">
                                    <button
                                      onClick={() => removeIngredientRow(index)}
                                      className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                                      disabled={!canEdit}
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Stickers */}

                        <div className="border-t border-gray-200 pt-4 flex justify-center">
                          <Button
                            onClick={addIngredientRow}
                            variant="create"
                            label="Agregar Ingrediente"
                            disabled={!canEdit}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center space-y-4">
                        <Text type="alert">No hay ingredientes agregados.</Text>
                        <div className="flex justify-center">
                          <Button
                            onClick={addIngredientRow}
                            variant="create"
                            label="Agregar Ingrediente"
                            disabled={!canEdit}
                          />
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
                    <div className="flex flex-wrap justify-center gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="toggleStickers1"
                          className="h-4 w-4"
                          checked={showStickers}
                          onChange={(e) => setShowStickers(e.target.checked)}
                          disabled={!canEdit}
                        />
                        <span className="text-sm text-black">
                          Añadir Sticker
                        </span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="toggleStickers2"
                          className="h-4 w-4"
                          checked={showStickers2}
                          onChange={(e) => setShowStickers2(e.target.checked)}
                          disabled={!canEdit}
                        />
                        <span className="text-sm text-black">
                          Añadir Sticker Blanco
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {showStickers && (
                        <div className="space-y-2">
                          <Text type="subtitle" color="#000">
                            Sticker
                          </Text>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-black text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={sticker}
                            onChange={(e) => setSticker(e.target.value)}
                            disabled={!canEdit}
                          />
                        </div>
                      )}

                      {showStickers2 && (
                        <div className="space-y-2">
                          <Text type="subtitle" color="#000">
                            Sticker Blanco
                          </Text>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-black text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={sticker2}
                            onChange={(e) => setSticker2(e.target.value)}
                            disabled={!canEdit}
                          />
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>

            {/* Footer acciones */}
            <div className="sticky bottom-0 z-10 bg-white border-t border-gray-200 px-2 sm:px-4 py-3">
              <div className="flex justify-center gap-3">
                <Button
                  onClick={() => setIsModalOpen(false)}
                  variant="cancel"
                  label="Cancelar"
                />
                {canEdit && (
                  <Button
                    onClick={handleSaveBOM}
                    variant="create"
                    label={currentBomId ? "Actualizar BOM" : "Guardar BOM"}
                    disabled={loadingArticles && isSaving}
                  />
                )}
              </div>
            </div>
          </div>
        </ModalSection>
      )}

      {/* Tabla principal */}
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
        onHistory={handleHistory}
      />

      {auditList.length > 0 && (
        <AuditModal audit={auditList} onClose={() => setAuditList([])} />
      )}
    </div>
  );
}

export default BOMManager;
