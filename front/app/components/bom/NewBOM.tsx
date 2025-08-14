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
import { getClients, getClientsId } from "@/app/services/userDash/clientServices";
import { getArticleByCode, newArticle, getArticlesId, deleteArticle, updateArticle, getBoms } from "@/app/services/bom/articleServices";
import { getAuditsByModel } from "../../services/history/historyAuditServices";

// Tipos e interfaces
import { Article, Ingredient, Bom, BomView, BomPayload } from "@/app/interfaces/BOM";
import { Audit } from "../../interfaces/Audit";
import { Client } from "@/app/interfaces/Client";
import DateLoader from '@/app/components/loader/DateLoader';

// 🆕 helper para uid estable por fila (no usar index como key)
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as any).randomUUID()
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
  // ❌ antes: Ingredient[]  ✅ ahora: LocalIngredient[]
  const [ingredients, setIngredients] = useState<LocalIngredient[]>([]);
  const [boms, setBoms] = useState<Bom[]>([]);
  const [bomStatus, setBomStatus] = useState(false); // false = inactivo, true = activo
  const [isSaving, setIsSaving] = useState(false);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [auditList, setAuditList] = useState<Audit[]>([]);
  const [, setSelectedAudit] = useState<Audit | null>(null);

  // 🆕 buscador independiente por ingrediente (clave = uid)
  const [ingredientSearch, setIngredientSearch] = useState<Record<string, string>>({});

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
            bom.ingredients && bom.ingredients !== "undefined" && bom.ingredients !== null
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
        let fetchedArticles: Article[] = articlesData?.data || [];
        setAllArticles(fetchedArticles);
        if (selectedArticle) {
          fetchedArticles = fetchedArticles.filter((a) => a.codart !== selectedArticle.codart);
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
      showError("Ya has seleccionado un artículo. Elimina el actual para seleccionar otro.");
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
  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
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
          const { [removed.uid]: _, ...rest } = s;
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

    setIsSaving(true);

    try {
      const code_details = JSON.stringify({ codart: selectedArticle.codart });
      const code_ingredients = JSON.stringify(
        ingredients.map((ing) => ({ codart: ing.codart }))
      );

      // 🧹 sacar uid del array antes de persistir
      const cleanIngredients: Ingredient[] = ingredients.map(({ uid: _uid, ...rest }) => rest);

      const bomPayload: BomPayload = {
        client_id: Number(selectedClient),
        base_quantity: baseQuantity.toString(),
        details: JSON.stringify({ article: selectedArticle }),
        code_details,
        ingredients: JSON.stringify(cleanIngredients),
        code_ingredients,
        status: bomStatus,
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

      const articleData =
        bom.details && bom.details !== "undefined" ? JSON.parse(bom.details).article : null;
      setSelectedArticle(articleData);

      const ingr: Ingredient[] =
        bom.ingredients && bom.ingredients !== "undefined" ? JSON.parse(bom.ingredients) : [];

      const ingrWithUid: LocalIngredient[] = ingr.map((it) => ({ ...it, uid: uid() }));
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

      {isSaving && (
        <DateLoader
          message="Cargando..."
          backgroundColor="rgba(0, 0, 0, 0.28)"
          color="rgba(255, 255, 0, 1)"
        />
      )}

      {isModalOpen && (
        <ModalSection isVisible={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <Text type="title" color="text-[#000]">
            {currentBomId ? "Editar BOM" : "Crear BOM"}
          </Text>

          <div className="mb-4">
            <Text type="subtitle" color="#000">
              Selecciona un Cliente:
            </Text>
            <select
              className="w-full border p-2 rounded text-black text-center"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              disabled={!canEdit}
            >
              <option value="">Seleccione...</option>
              {clients.map((client) => (
                <option key={client.code} value={client.id.toString()}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {(selectedClient || currentBomId) && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <Text type="subtitle" color="#000">
                  Artículos Disponibles:
                </Text>
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
                        className={`border-b py-1 px-2 text-black cursor-pointer transition ${
                          canEdit ? "hover:bg-blue-100" : "text-gray-400 cursor-not-allowed"
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
                <Text type="subtitle" color="#000">
                  Artículo Seleccionado:
                </Text>
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
              <Text type="subtitle" color="#000">
                Cantidad Base:
              </Text>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                className="w-full border p-2 rounded text-black text-center"
                value={baseQuantity === 0 ? "" : baseQuantity}
                onChange={(e) => {
                  const val = e.target.value;
                  setBaseQuantity(val === "" ? 0 : Number(val));
                }}
                disabled={!canEdit}
              />
            </div>

            <div className="mt-4">
              <Text type="subtitle" color="#000">
                Estado:
              </Text>
              <select
                className="w-full border p-2 rounded text-black text-center"
                value={bomStatus ? "activo" : "inactivo"}
                onChange={(e) => setBomStatus(e.target.value === "activo")}
                disabled={!canEdit}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          {selectedArticle && (
            <div className="mt-6">
              <Text type="subtitle" color="text-gray-800">
                Materiales:
              </Text>

              {ingredients.length > 0 ? (
                <>
                  {ingredients.map((ing, index) => {
                    const term = ingredientSearch[ing.uid] ?? "";
                    const rowFilteredArticles = allArticles.filter(
                      (article) =>
                        article.desart.toLowerCase().includes(term.toLowerCase()) ||
                        article.codart.toLowerCase().includes(term.toLowerCase())
                    );

                    return (
                      <div key={ing.uid}>
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 hover:shadow-md transition-shadow duration-300">
                          <div className="flex flex-col md:flex-row gap-2">
                            {/* Buscador + Lista de artículos */}
                            <div className="flex-1">
                              <Text type="subtitle" color="#000">
                                Buscar artículo
                              </Text>
                              <input
                                type="text"
                                placeholder="Nombre o código del artículo..."
                                className="w-full px-5 py-3 border border-gray-300 rounded-xl text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={term}
                                onChange={(e) =>
                                  setIngredientSearch((prev) => ({
                                    ...prev,
                                    [ing.uid]: e.target.value,
                                  }))
                                }
                                disabled={!canEdit}
                              />

                              <div className="mt-4 max-h-64 overflow-y-auto border border-gray-300 rounded-xl divide-y divide-gray-100 shadow-inner bg-white">
                                {rowFilteredArticles.length > 0 ? (
                                  rowFilteredArticles.map((article) => (
                                    <label
                                      key={article.codart}
                                      className={`flex items-center px-5 py-3 text-base cursor-pointer text-black transition-colors duration-150 ${
                                        ing.codart === article.codart
                                          ? "bg-blue-100 text-black font-medium"
                                          : "hover:bg-blue-50"
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name={`article-${ing.uid}`}
                                        className="mr-3 accent-blue-600 scale-110"
                                        value={article.codart}
                                        checked={ing.codart === article.codart}
                                        onChange={() =>
                                          handleIngredientSelect(index, article.codart)
                                        }
                                        disabled={!canEdit}
                                      />
                                      {article.desart} ({article.codart})
                                    </label>
                                  ))
                                ) : (
                                  <div className="p-5 text-base text-gray-500">
                                    No se encontraron artículos.
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Inputs y botón */}
                            <div className="mt-8">
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
                                    handleIngredientChange(index, "quantity", e.target.value)
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
                                    handleIngredientChange(index, "merma", e.target.value)
                                  }
                                  disabled={!canEdit}
                                />
                              </div>

                              <div className="pt-4">
                                <button
                                  onClick={() => removeIngredientRow(index)}
                                  className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200"
                                  disabled={!canEdit}
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Botón único para agregar ingrediente */}
                  <hr className="my-4 border-t border-gray-600 w-full max-w-lg mx-auto opacity-60" />
                  <div className="flex justify-center gap-4 mt-6">
                    <Button
                      onClick={addIngredientRow}
                      variant="create"
                      label="Agregar Ingrediente"
                      disabled={!canEdit}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <Text type="alert">No hay ingredientes agregados.</Text>
                  <hr className="my-4 border-t border-gray-600 w-full max-w-lg mx-auto opacity-60" />
                  <div className="flex justify-center gap-4 mt-6">
                    <Button
                      onClick={addIngredientRow}
                      variant="create"
                      label="Agregar Ingrediente"
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <hr className="my-4 border-t border-gray-600 w-full max-w-lg mx-auto opacity-60" />
          <div className="flex justify-center gap-4 mt-6">
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
        onHistory={handleHistory}
      />
      {auditList.length > 0 && <AuditModal audit={auditList} onClose={() => setAuditList([])} />}
    </div>
  );
}

export default BOMManager;
