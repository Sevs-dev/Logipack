import React, { useState, useEffect, useMemo } from "react";
import { ClipboardCopy } from "lucide-react";
// 🔹 Servicios
import {
  getClients,
  getClientsId,
} from "@/app/services/userDash/clientServices";
import { getFactory } from "@/app/services/userDash/factoryServices";
import { getPrefix } from "@/app/services/consecutive/consecutiveServices";
import {
  getArticleByCode,
  getArticleByClient,
} from "@/app/services/bom/articleServices";
import {
  newAdaptation,
  getAdaptations,
  deleteAdaptation,
  updateAdaptation,
  getAdaptationsId,
} from "@/app/services/adaptation/adaptationServices";
import { getMaestra } from "../../services/maestras/maestraServices";
import { getAuditsByModelAdaptation } from "../../services/history/historyAuditServices";
// 🔹 Componentes
import Button from "../buttons/buttons";
import FileButton from "../buttons/FileButton";
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
import {
  Adaptation,
  ArticleFormData,
  Plant,
} from "@/app/interfaces/NewAdaptation";
import { Audit } from "../../interfaces/Audit";
import DateLoader from "../loader/DateLoader";
import { Input } from "../inputs/Input";

type IngredientOpt = Ingredient & {
  validar?: number;
  quantity?: number;
  manualEdit?: boolean;
};

function NewAdaptation({
  canEdit = false,
  canView = false,
}: CreateClientProps) {
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
  const [articleFields, setArticleFields] = useState<
    Record<string, ArticleFormData>
  >({});

  // Orden y datos de producción (modo con BOM)
  const [client_order, setClientOrder] = useState<string>("");
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [quantityToProduce, setQuantityToProduce] = useState(""); // input controlado (string), se convierte a number al enviar
  const [lot, setLot] = useState<string>("");
  const [healthRegistration, setHealthRegistration] = useState<string>("");

  // BOM e Ingredientes
  const [boms, setBoms] = useState<Bom[]>([]);
  const [selectedBom, setSelectedBom] = useState<string>(""); // value del <select> como string
  const [bomIdToSelect, setBomIdToSelect] = useState<number | null>(null); // id numérico a preseleccionar en edición
  const [ingredients, setIngredients] = useState<IngredientOpt[]>([]);

  // Adaptaciones
  const [adaptation, setAdaptation] = useState<Adaptation[]>([]);
  const [editAdaptationId, setEditAdaptationId] = useState<number | null>(null);

  // Adjuntos
  const [attachments, setAttachments] = useState<File[]>([]);
  const [, setAttachmentUrl] = useState<string | null>(null);

  // Consecutivo
  const [, setConsecutivo] = useState<string | null>(null);

  // Auditoría
  const [auditList, setAuditList] = useState<Audit[]>([]);
  const [, setSelectedAudit] = useState<Audit | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ======================= 📥 Carga de datos =======================

  const fetchAdaptations = async () => {
    try {
      const adaptations = await getAdaptations();
      const fullData = await Promise.all(
        adaptations.map(async (a: Adaptation) => {
          const client = await getClientsId(a.client_id);
          return {
            ...a,
            client_name: (client as Client).name,
            numberOrder: (client as Client).number_order,
          };
        })
      );
      setAdaptation(fullData);
    } catch (error) {
      showError("Error al cargar adaptaciones.");
      console.error(error);
    }
  };

  useEffect(() => {
    if (canView) void fetchAdaptations();
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
    void fetchClients();
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
    void fetchFactories();
  }, []);

  // Cargar Maestras
  useEffect(() => {
    const fetchMaestras = async () => {
      try {
        setIsLoading(true);
        const maestrasData = await getMaestra();
        setMaestra(maestrasData);
      } catch (err) {
        showError("Error al cargar las maestras.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchMaestras();
  }, []);

  // Cargar Artículos por Cliente
  useEffect(() => {
    if (!selectedClient) return;
    let isMounted = true;
    const fetchArticlesByClient = async () => {
      try {
        setIsLoading(true);
        const clientData = await getClientsId(Number(selectedClient));

        if (!(clientData as Client)?.code) {
          showError("Código de cliente no disponible.");
          return;
        }
        const articlesData = await getArticleByCode(
          (clientData as Client).code
        );
        const list: Article[] = (articlesData.data as Article[]) || [];

        if (isMounted) {
          setArticles(list);
          if (list.length === 0)
            showError("Este cliente no tiene artículos disponibles.");
        }
      } catch (err) {
        if (isMounted) showError("Error al cargar los artículos.");
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void fetchArticlesByClient();
    return () => {
      isMounted = false;
    };
  }, [selectedClient]);

  // Sincronizar selectedArticles cuando cambia el catálogo
  useEffect(() => {
    if (articles.length > 0 && selectedArticles.length > 0) {
      const formatted = articles.filter((article) =>
        selectedArticles.some((sel) => sel.codart === article.codart)
      );
      setSelectedArticles((prev) =>
        JSON.stringify(prev) !== JSON.stringify(formatted) ? formatted : prev
      );
    }
  }, [articles, selectedArticles]);

  // Cargar BOMs e ingredientes si se requiere
  useEffect(() => {
    if (!selectedClient || selectedMaestras.length === 0) return;
    const selectedMaestraObj = maestra.find(
      (m) => m.id.toString() === selectedMaestras[0]
    );
    if (!selectedMaestraObj?.requiere_bom) {
      setBoms([]);
      setIngredients([]);
      setSelectedBom("");
      return;
    }
    const fetchBom = async () => {
      try {
        setBoms([]);
        if (bomIdToSelect === null) setSelectedBom(""); // NO limpiar si estamos preseleccionando
        if (bomIdToSelect === null) setIngredients([]);

        const clientData = await getClientsId(Number(selectedClient));
        const bomList = (await getArticleByClient(
          (clientData as Client).id
        )) as Array<Bom | (Bom & { status: number })>;

        if (!Array.isArray(bomList)) {
          console.error("❌ La respuesta de BOMs no es un array:", bomList);
          setBoms([]);
          if (bomIdToSelect === null) setIngredients([]);
          return;
        }

        // Filtrar activos y normalizar status -> boolean
        const bomsNormalizados: Bom[] = bomList
          .filter((b) => Boolean(b.status))
          .map((b) => ({ ...(b as Bom), status: Boolean(b.status) }));

        setBoms(bomsNormalizados);

        // Si NO estamos preseleccionando (edición), precargar latest
        if (bomIdToSelect === null && bomsNormalizados.length > 0) {
          const latest = [...bomsNormalizados].sort(
            (a, b) => Number(b.version) - Number(a.version)
          )[0];
          if (latest?.ingredients) {
            try {
              const parsed = JSON.parse(latest.ingredients) as IngredientOpt[];
              setIngredients(parsed);
            } catch {
              setIngredients([]);
            }
          } else {
            setIngredients([]);
          }
        }
      } catch (err) {
        showError("Error al obtener BOM.");
        console.error(err);
        setBoms([]);
        if (bomIdToSelect === null) setIngredients([]);
      }
    };
    void fetchBom();
  }, [selectedClient, selectedMaestras, maestra, bomIdToSelect]);

  // Aplicar el BOM pendiente (al editar) cuando la lista ya está
  useEffect(() => {
    if (bomIdToSelect !== null && boms.length > 0) {
      const found = boms.find((b) => Number(b.id) === Number(bomIdToSelect));
      if (found) {
        setSelectedBom(String(bomIdToSelect)); // value del select
        // Alinear Artículo con el BOM
        try {
          const { codart } = JSON.parse(found.code_details || "{}") as {
            codart?: string;
          };
          if (codart) {
            const matchingArticle = articles.find((a) => a.codart === codart);
            if (matchingArticle) setSelectedArticles([matchingArticle]);
          }
        } catch {
          /* noop */
        }
      }
      setBomIdToSelect(null); // consumido
    }
  }, [bomIdToSelect, boms, articles]);

  // Reconciliar selectedBom cuando llegan los BOM (por si hay diferencias number/string/espacios)
  useEffect(() => {
    if (!selectedBom || boms.length === 0) return;
    const sb = normalizeId(selectedBom);
    const exists = boms.some((b) => normalizeId(b.id) === sb);
    if (!exists) {
      const found = boms.find((b) => Number(b.id) === Number(sb));
      if (found) setSelectedBom(normalizeId(found.id));
    } else if (sb !== selectedBom) {
      setSelectedBom(sb); // quita espacios/ceros a la izquierda
    }
  }, [selectedBom, boms]);

  // Recalcular ingredientes cuando cambia cantidad o contenido (firma)
  const ingredientsSignature = useMemo(
    () =>
      ingredients
        .map(
          (i) =>
            `${i.codart}|${String(i.merma)}|${String(
              i.quantity ?? ""
            )}|${String(i.desart)}`
        )
        .join("~"),
    [ingredients]
  );

  useEffect(() => {
    if (quantityToProduce === "") return;

    const qty = Number(quantityToProduce);
    if (!Number.isFinite(qty) || !ingredients.length) return;

    setIngredients((prev) => {
      const next = prev.map((ing) => {
        const raw = (ing?.merma ?? "0").toString().trim();
        let m = parseFloat(raw.replace(",", "."));
        if (!Number.isFinite(m)) m = 0;
        if (raw.includes("%") || m > 1) m = m / 100;
        m = Math.min(1, Math.max(0, m));
        const teorica = qty * (1 + m);
        return { ...ing, teorica: teorica.toFixed(4) };
      });

      const unchanged =
        prev.length === next.length &&
        prev.every((p, i) => String(p.teorica) === String(next[i].teorica));
      return unchanged ? prev : next;
    });
  }, [quantityToProduce, ingredientsSignature, ingredients.length]);

  // Selección de maestra y requisito de BOM
  const maestraSeleccionada = useMemo(
    () => maestra.find((m) => m.id.toString() === selectedMaestras[0]),
    [selectedMaestras, maestra]
  );
  const maestraRequiereBOM = maestraSeleccionada?.requiere_bom ?? false;

  useEffect(() => {
    if (maestraRequiereBOM) {
      setArticleFields({});
      setSelectedArticles([]);
    } else {
      setSelectedBom("");
      setIngredients([]);
      setOrderNumber("");
      setDeliveryDate("");
      setQuantityToProduce("");
      setLot("");
      setHealthRegistration("");
    }
  }, [maestraRequiereBOM]);

  // ======================= 🔁 Funciones de cambio y copia =======================

  const handlePlantaChange = async (value: string) => {
    setPlanta(value);
    const selected = plantas.find((p) => p.id.toString() === value);
    if (!selected?.prefix) return;

    try {
      const { consecutives } = await getPrefix(selected.prefix);
      if (consecutives?.length) {
        const cons = consecutives[0];
        setConsecutivo(cons);
        setClientOrder(
          `${cons.prefix}-${cons.year}-${cons.month}-${cons.consecutive}`
        );
      }
    } catch (error) {
      console.error("Error al obtener el consecutivo:", error);
    }
  };

  const copyToClipboard = () => {
    if (client_order) {
      void navigator.clipboard.writeText(client_order);
      showSuccess("Orden copiada al portapapeles");
    }
  };

  const visualOrder = useMemo(() => {
    if (!client_order) return "";
    if (!/\d{7}$/.test(client_order)) return "";
    if (client_order.endsWith("0000000")) return "";
    const match = client_order.match(/(\d{7})$/)?.[1];
    if (match) {
      const incremented = String(parseInt(match, 10) + 1).padStart(7, "0");
      return client_order.replace(/(\d{7})$/, incremented);
    }
    return "";
  }, [client_order]);

  type IngredientField = keyof IngredientOpt;

  const handleChange = (
    index: number,
    field: IngredientField,
    value: string
  ): void => {
    const updated = [...ingredients];
    updated[index] = {
      ...updated[index],
      [field]: value as never,
      ...(field === "teorica" ? { manualEdit: true } : {}),
    };
    setIngredients(updated);
  };

  const handleFieldChange = <K extends keyof ArticleFormData>(
    codart: string,
    field: K,
    value: ArticleFormData[K]
  ) => {
    setArticleFields((prev) => ({
      ...prev,
      [codart]: {
        ...prev[codart],
        [field]: value,
      },
    }));
  };

  // Selección de BOM (unificado)
  const handleBomChange = (value: string) => {
    setSelectedBom(value);

    // limpiar campos globales ligados a BOM
    setOrderNumber("");
    setDeliveryDate("");
    setQuantityToProduce("");
    setLot("");
    setHealthRegistration("");
    setAttachments([]);

    const selectedBomId = Number(value);
    const bom = boms.find((b) => Number(b.id) === selectedBomId);
    let codart = "";
    try {
      if (bom?.code_details) {
        const parsed = JSON.parse(bom.code_details) as { codart?: string };
        codart = parsed?.codart || "";
      }
    } catch {
      /* noop */
    }
    if (codart) {
      const matchingArticle = articles.find((a) => a.codart === codart);
      setSelectedArticles(matchingArticle ? [matchingArticle] : []);
    } else {
      setSelectedArticles([]);
    }
  };

  // ======================= 📤 Envío del formulario =======================

  const isBrowserFile = (v: unknown): v is File => {
    return (
      typeof window !== "undefined" &&
      typeof (window as Window & typeof globalThis).File !== "undefined" &&
      v instanceof (window as Window & typeof globalThis).File
    );
  };

  const handleSubmit = async () => {
    if (isSaving) return;

    // ✅ Validaciones básicas
    if (!selectedClient) {
      showError("Selecciona un Cliente.");
      return;
    }
    if (!planta) {
      showError("Selecciona una Planta.");
      return;
    }
    if (!selectedArticles.length) {
      showError("Selecciona al menos un artículo.");
      return;
    }
    if (!selectedMaestras.length) {
      showError("Selecciona una Maestra.");
      return;
    }
    if (maestraRequiereBOM && !selectedBom) {
      showError("Selecciona un BOM.");
      return;
    }

    // 🧩 Armar articlesData con/ sin BOM
    let articlesData: Array<{
      codart: string;
      number_order: string;
      orderNumber: string;
      deliveryDate: string;
      quantityToProduce: number;
      lot: string;
      healthRegistration: string;
    }>;

    if (maestraRequiereBOM) {
      if (
        !orderNumber ||
        !deliveryDate ||
        !quantityToProduce ||
        !lot ||
        !healthRegistration
      ) {
        showError("Completa todos los campos del artículo.");
        return;
      }
      articlesData = [
        {
          codart: selectedArticles[0]?.codart || "",
          number_order: client_order,
          orderNumber,
          deliveryDate,
          quantityToProduce: Number(quantityToProduce),
          lot,
          healthRegistration,
        },
      ];
    } else {
      const invalids = selectedArticles.filter(({ codart }) => {
        const f = articleFields[codart];
        const missing = [
          "orderNumber",
          "deliveryDate",
          "quantityToProduce",
          "lot",
          "healthRegistration",
        ].filter((k) => !f?.[k as keyof ArticleFormData]);
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
          quantityToProduce: Number(f.quantityToProduce),
          lot: f.lot,
          healthRegistration: f.healthRegistration,
        };
      });
    }

    // 📦 FormData
    const formData = new FormData();
    formData.append("client_id", String(selectedClient));
    formData.append("factory_id", planta);
    formData.append("article_code", JSON.stringify(articlesData));
    formData.append("number_order", client_order);
    formData.append("orderNumber", orderNumber);
    formData.append("master", selectedMaestras[0]);
    formData.append("bom", selectedBom); // value string
    formData.append("ingredients", JSON.stringify(ingredients));

    // Adjuntos generales
    if (attachments.length === 1 && isBrowserFile(attachments[0])) {
      formData.append("attachment", attachments[0]);
    } else if (attachments.length > 1) {
      attachments.forEach((f) => {
        if (isBrowserFile(f)) formData.append("attachments[]", f);
      });
    }

    // Adjuntos por artículo
    selectedArticles.forEach(({ codart }) => {
      const maybeFile: unknown = articleFields[codart]?.attachment;
      if (isBrowserFile(maybeFile)) {
        formData.append(`attachment_${codart}`, maybeFile);
      }
    });

    try {
      setIsSaving(true);
      setIsLoading(true);

      if (isEditMode) {
        await updateAdaptation(editAdaptationId!, formData);
        showSuccess("Acondicionamiento actualizado.");
      } else {
        await newAdaptation(formData);
        showSuccess("Acondicionamiento creado.");
      }

      setIsOpen(false);
      void fetchAdaptations();
      resetForm();
    } catch (error) {
      showError("Error al guardar.");
      console.error(error);
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  };

  // ======================= ✏️ Edición =======================

  const handleEdit = async (id: number) => {
    setIsSaving(false);
    try {
      const { adaptation: adp } = await getAdaptationsId(id);
      if (!adp) {
        showError("La adaptación no existe");
        console.warn("⚠️ Adaptation no encontrada con ID:", id);
        setIsSaving(false);
        return;
      }
      setIsEditMode(true);
      setEditAdaptationId(id);

      // Cliente como number (state es number|"")
      if (typeof adp.client_id === "number") setSelectedClient(adp.client_id);
      else setSelectedClient("");

      setPlanta(adp.factory_id?.toString() ?? "");
      setSelectedMaestras(adp.master != null ? [String(adp.master)] : []);

      // 👉 fuerza value del select BOM y además deja id pendiente para sincronizar con la lista
      setSelectedBom(adp.bom != null ? normalizeId(adp.bom) : "");
      setBomIdToSelect(adp.bom != null ? Number(normalizeId(adp.bom)) : null);

      const parsedArticles = adp.article_code
        ? JSON.parse(adp.article_code)
        : [];
      setSelectedArticles(
        parsedArticles.map((a: { codart: string }) => ({ codart: a.codart }))
      );
      setClientOrder(adp.number_order || "");

      if (adp.bom) {
        const general = parsedArticles[0] || {};
        setOrderNumber(general.orderNumber ?? "");
        setClientOrder(general.client_order ?? adp.number_order ?? "");
        setDeliveryDate(formatDate(general.deliveryDate ?? ""));
        setQuantityToProduce(String(general.quantityToProduce ?? ""));
        setLot(general.lot ?? "");
        setHealthRegistration(general.healthRegistration ?? "");
        setAttachments([]);
        setAttachmentUrl(
          general.attachment ? `/storage/${general.attachment}` : null
        );
        setArticleFields({});
      } else {
        const fieldsMap: Record<string, ArticleFormData> = {};
        parsedArticles.forEach(
          (a: {
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
              quantityToProduce:
                typeof a.quantityToProduce === "number"
                  ? a.quantityToProduce
                  : Number(a.quantityToProduce ?? 0),
              lot: a.lot ?? "",
              healthRegistration: a.healthRegistration ?? "",
              attachment: undefined,
            };
          }
        );
        setArticleFields(fieldsMap);
      }

      if (adp.ingredients) {
        try {
          const parsed = JSON.parse(adp.ingredients) as IngredientOpt[];
          const enriched = parsed.map((i) => {
            const hasValidTeorica =
              i.teorica !== undefined &&
              i.teorica !== null &&
              !isNaN(Number(i.teorica));

            const teoricaCalculada = (
              Number(i.quantity ?? 0) *
              (1 + Number(i.merma || 0))
            ).toFixed(4);

            return {
              ...i,
              teorica: hasValidTeorica
                ? Number(i.teorica).toFixed(4)
                : teoricaCalculada,
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
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  };

  // ======================= 🗑️ Eliminación =======================

  const handleDelete = async (id: number) => {
    if (!canEdit) return;

    showConfirm("¿Seguro que quieres eliminar esta Adaptación?", async () => {
      try {
        await deleteAdaptation(id);
        setAdaptation(adaptation.filter((a) => a.id !== id));
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
    // modos/ids
    setIsEditMode(false);
    setEditAdaptationId(null);
    setBomIdToSelect(null);

    // selección principal
    setSelectedClient("");
    setPlanta("");

    // pedido/orden
    setClientOrder("");
    setOrderNumber("");
    setDeliveryDate("");
    setQuantityToProduce("");
    setLot("");
    setHealthRegistration("");

    // maestras/BOM/artículos
    setSelectedMaestras([]);
    setSelectedBom("");
    setBoms([]);
    setArticles([]);
    setSelectedArticles([]);
    setArticleFields({});

    // materiales/archivos/auditoría
    setIngredients([]);
    setAttachments([]);
    setAuditList([]);
    setSelectedAudit(null);
  };

  const handleHistory = async (id: number) => {
    const model = "Adaptation";
    try {
      const data = await getAuditsByModelAdaptation(model, id);
      setAuditList(data);
      if (data.length > 0) setSelectedAudit(data[0]);
    } catch (error) {
      console.error("Error al obtener la auditoría:", error);
    }
  };

  const normalizeId = (x: unknown): string => {
    const s = String(x ?? "").trim();
    const n = Number(s);
    return Number.isFinite(n) ? String(n) : s; // "05" -> "5", "5 " -> "5"
  };

  return (
    <div>
      <div className="flex justify-center space-x-2 mb-2">
        {canEdit && (
          <Button
            onClick={() => {
              resetForm();
              setIsEditMode(false);
              setIsOpen(true);
            }}
            variant="create"
            label="Crear Acondicionamiento"
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
      {isOpen && (
        <ModalSection
          isVisible={isOpen}
          onClose={() => (resetForm(), setIsOpen(false))}
        >
          <div className="dark:[--surface:30_41_59] dark:[--surface-muted:51_65_85] dark:[--border:71_85_105] dark:[--foreground:241_245_249] dark:[--ring:56_189_248] dark:[--accent:56_189_248]">
            <Text type="title" color="text-[rgb(var(--foreground))]">
              {isEditMode ? "Editar" : "Crear"} Acondicionamiento
            </Text>

            {isLoading && (
              <div className="flex justify-center py-4">
                <div className="w-12 h-12 border-4 border-[rgb(var(--border))]/40 border-t-[rgb(var(--accent))] rounded-full animate-spin"></div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Planta/Cliente/Orden */}
              <div className="col-span-full">
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                      Planta:
                    </Text>
                    <select
                      className={[
                        "w-full p-3 rounded-lg mt-1 text-center",
                        "border bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))]",
                        "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
                        "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
                      ].join(" ")}
                      value={planta}
                      onChange={(e) => void handlePlantaChange(e.target.value)}
                      disabled={!canEdit}
                    >
                      <option value="">Seleccione...</option>
                      {plantas.map((plant) => (
                        <option
                          key={plant.id}
                          value={plant.id.toString()}
                          className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] dark:bg-slate-900 dark:text-slate-100"
                        >
                          {plant.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-1/2">
                    <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                      Cliente:
                    </Text>
                    <select
                      className={[
                        "w-full p-3 rounded-lg mt-1 text-center",
                        "border bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))]",
                        "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
                        "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
                      ].join(" ")}
                      value={
                        selectedClient === "" ? "" : String(selectedClient)
                      } // asegurar string
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        setSelectedClient(id);
                        // Limpiar dependencias del cliente
                        setSelectedArticles([]);
                        setArticleFields({});
                        setSelectedMaestras([]);
                        setSelectedBom("");
                        setBoms([]);
                        setIngredients([]);
                        setOrderNumber("");
                        setDeliveryDate("");
                        setQuantityToProduce("");
                        setLot("");
                        setHealthRegistration("");
                        setAttachments([]);
                      }}
                      disabled={!canEdit}
                    >
                      <option value="">Seleccione...</option>
                      {clients.map((client) => (
                        <option
                          key={client.id}
                          value={client.id.toString()}
                          className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] dark:bg-slate-900 dark:text-slate-100"
                        >
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-1/2 max-w-md relative group space-y-2 mt-1">
                    <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                      Orden:
                    </Text>

                    <div
                      className={[
                        "relative rounded-lg px-4 py-3 mt-2 shadow-sm",
                        "bg-[rgb(var(--surface-muted))] border border-[rgb(var(--border))]",
                        "dark:bg-slate-800/70 dark:border-slate-700",
                      ].join(" ")}
                    >
                      <p className="text-center font-mono text-sm text-[rgb(var(--foreground))] tracking-wide select-none">
                        {isEditMode
                          ? client_order || "No disponible"
                          : visualOrder || "Cargando orden..."}
                      </p>

                      <button
                        type="button"
                        onClick={copyToClipboard}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-[rgb(var(--foreground))]/50 hover:text-[rgb(var(--accent))] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] rounded-full p-1"
                        title="Copiar al portapapeles"
                      >
                        <ClipboardCopy size={20} />
                        <span className="absolute hidden group-hover:block -top-8 right-0 bg-[rgb(var(--foreground))] text-[rgb(var(--surface))] text-xs rounded py-1 px-2 whitespace-nowrap z-50">
                          Copiar
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Maestras y BOM */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Maestras:
                </Text>
                <select
                  className={[
                    "w-full p-3 rounded-lg mt-1 text-center",
                    "border bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))]",
                    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
                    "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
                  ].join(" ")}
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
                      className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] dark:bg-slate-900 dark:text-slate-100"
                    >
                      {master.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Adjuntar:
                </Text>
                {canEdit && (
                  <FileButton
                    onChange={(fileList) => {
                      const files = Array.isArray(fileList)
                        ? fileList
                        : [fileList];
                      setAttachments(files.filter(Boolean) as File[]);
                    }}
                    maxSizeMB={5}
                    allowMultiple={true}
                  />
                )}
              </div>

              <div
                className={`col-span-full grid grid-cols-1 ${
                  maestraRequiereBOM ? "sm:grid-cols-2" : "lg:grid-cols-1"
                } gap-4`}
              >
                {/* Select de BOM solo si se requiere */}
                {maestraRequiereBOM && (
                  <div>
                    <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                      BOM:
                    </Text>
                    <select
                      className={[
                        "w-full p-3 rounded-lg mt-1 text-center",
                        "border bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))]",
                        "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
                        "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
                      ].join(" ")}
                      onChange={(e) => handleBomChange(e.target.value)}
                      disabled={!canEdit}
                      value={normalizeId(selectedBom)} // 👈 normalizado
                    >
                      <option value="">Seleccione un BOM...</option>
                      {Array.isArray(boms) && boms.length > 0 ? (
                        boms.map((bom) => (
                          <option
                            key={bom.id}
                            value={normalizeId(bom.id)} // 👈 normalizado
                            className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] dark:bg-slate-900 dark:text-slate-100"
                          >
                            {(() => {
                              try {
                                return (
                                  JSON.parse(bom.code_details || "{}")
                                    ?.codart ?? "Sin código"
                                );
                              } catch {
                                return "Sin código";
                              }
                            })()}
                          </option>
                        ))
                      ) : (
                        <option disabled>No hay BOMs disponibles</option>
                      )}
                    </select>
                  </div>
                )}

                {/* Artículos (cuando NO requiere BOM se mantiene MultiSelect) */}
                <div>
                  <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                    Artículos:
                  </Text>

                  {maestraRequiereBOM ? (
                    <select
                      className={[
                        "w-full p-3 rounded-lg mt-1 text-center",
                        "border bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] border-[rgb(var(--border))]",
                        "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
                        "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
                      ].join(" ")}
                      onChange={(e) => handleBomChange(e.target.value)}
                      disabled={!canEdit}
                      value={selectedBom}
                    >
                      <option value="">Seleccione un BOM...</option>
                      {Array.isArray(boms) && boms.length > 0 ? (
                        boms.map((bom) => {
                          let label = "Sin código";
                          try {
                            const parsed = JSON.parse(bom.code_details || "{}");
                            label = parsed?.codart || "Sin código";
                          } catch {
                            /* noop */
                          }
                          return (
                            <option
                              key={bom.id}
                              value={String(bom.id)} // value como string
                              className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] dark:bg-slate-900 dark:text-slate-100"
                            >
                              {label}
                            </option>
                          );
                        })
                      ) : (
                        <option disabled>No hay BOMs disponibles</option>
                      )}
                    </select>
                  ) : articles.length > 0 ? (
                    <MultiSelect<Article>
                      options={articles}
                      selected={selectedArticles}
                      onChange={setSelectedArticles}
                      getLabel={(article) => article.codart}
                      getValue={(article) => article.codart}
                    />
                  ) : (
                    <p className="text-sm italic text-[rgb(var(--foreground))]/60 mt-2 text-center">
                      No hay artículos disponibles para este cliente.
                    </p>
                  )}
                </div>
              </div>

              {/* Campos en grid responsivo */}
              {maestraRequiereBOM ? (
                <div
                  className={[
                    "col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-md transition-shadow",
                    "border bg-[rgb(var(--surface))] border-[rgb(var(--border))] shadow-sm hover:shadow-md",
                    "dark:bg-slate-900 dark:border-slate-700",
                  ].join(" ")}
                >
                  <div>
                    <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                      N° Orden del Cliente Con:
                    </Text>
                    <Input
                      type="text"
                      className="mt-1 text-center"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      disabled={!canEdit}
                      tone="strong"
                    />
                  </div>

                  <div>
                    <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                      Fecha Vencimiento:
                    </Text>
                    <Input
                      type="date"
                      className="mt-1 text-center"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      disabled={!canEdit}
                      tone="strong"
                    />
                  </div>

                  <div>
                    <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                      Cantidad a Producir:
                    </Text>
                    <Input
                      type="number"
                      className="mt-1 text-center"
                      value={quantityToProduce ?? ""}
                      onChange={(e) => setQuantityToProduce(e.target.value)}
                      min={1}
                      disabled={!canEdit}
                      tone="strong"
                    />
                  </div>

                  <div>
                    <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                      Lote:
                    </Text>
                    <Input
                      type="text"
                      className="mt-1 text-center"
                      value={lot}
                      onChange={(e) => setLot(e.target.value)}
                      disabled={!canEdit}
                      tone="strong"
                    />
                  </div>

                  <div>
                    <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                      Registro Sanitario:
                    </Text>
                    <Input
                      type="text"
                      className="mt-1 text-center"
                      value={healthRegistration}
                      onChange={(e) => setHealthRegistration(e.target.value)}
                      disabled={!canEdit}
                      tone="strong"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 col-span-full sm:grid-cols-2 rounded-xl p-4 border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-sm dark:bg-slate-900 dark:border-slate-700">
                  {selectedArticles.map((article) => (
                    <div
                      key={article.codart}
                      className="border border-[rgb(var(--border))] rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-5 flex flex-col gap-4 dark:border-slate-700"
                    >
                      <Text type="title" color="text-[rgb(var(--foreground))]">
                        Artículo: {article.codart}
                      </Text>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                          <Text
                            type="subtitle"
                            color="text-[rgb(var(--foreground))]"
                          >
                            N° Orden del Cliente:
                          </Text>
                          <Input
                            type="text"
                            className="mt-1 text-center"
                            value={
                              articleFields[article.codart]?.orderNumber || ""
                            }
                            onChange={(e) =>
                              handleFieldChange(
                                article.codart,
                                "orderNumber",
                                e.target.value
                              )
                            }
                            disabled={!canEdit}
                            tone="strong"
                          />
                        </div>

                        <div>
                          <Text
                            type="subtitle"
                            color="text-[rgb(var(--foreground))]"
                          >
                            Fecha Vencimiento:
                          </Text>
                          <Input
                            type="date"
                            className="mt-1 text-center"
                            value={
                              articleFields[article.codart]?.deliveryDate || ""
                            }
                            onChange={(e) =>
                              handleFieldChange(
                                article.codart,
                                "deliveryDate",
                                e.target.value
                              )
                            }
                            disabled={!canEdit}
                            tone="strong"
                          />
                        </div>

                        <div>
                          <Text
                            type="subtitle"
                            color="text-[rgb(var(--foreground))]"
                          >
                            Cant. a Producir:
                          </Text>
                          <Input
                            type="number"
                            className="mt-1 text-center"
                            value={
                              articleFields[article.codart]
                                ?.quantityToProduce ?? 0
                            }
                            onChange={(e) =>
                              handleFieldChange(
                                article.codart,
                                "quantityToProduce",
                                Number(e.target.value)
                              )
                            }
                            disabled={!canEdit}
                            tone="strong"
                          />
                        </div>

                        <div>
                          <Text
                            type="subtitle"
                            color="text-[rgb(var(--foreground))]"
                          >
                            Lote:
                          </Text>
                          <Input
                            type="text"
                            className="mt-1 text-center"
                            value={articleFields[article.codart]?.lot || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                article.codart,
                                "lot",
                                e.target.value
                              )
                            }
                            disabled={!canEdit}
                            tone="strong"
                          />
                        </div>

                        <div>
                          <Text
                            type="subtitle"
                            color="text-[rgb(var(--foreground))]"
                          >
                            R. Sanitario:
                          </Text>
                          <Input
                            type="text"
                            className="mt-1 text-center"
                            value={
                              articleFields[article.codart]
                                ?.healthRegistration || ""
                            }
                            onChange={(e) =>
                              handleFieldChange(
                                article.codart,
                                "healthRegistration",
                                e.target.value
                              )
                            }
                            disabled={!canEdit}
                            tone="strong"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Materiales: solo cuando hay Maestra, requiere BOM, BOM seleccionado e ingredientes */}
              {selectedMaestras.length > 0 &&
              maestraRequiereBOM &&
              selectedBom !== "" &&
              ingredients.length > 0 ? (
                <div className="col-span-full">
                  <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                    Materiales:
                  </Text>
                  <div>
                    <table className="w-full border-collapse text-[rgb(var(--foreground))] border border-[rgb(var(--border))] dark:border-slate-700">
                      <thead className="bg-[rgb(var(--surface-muted))] dark:bg-slate-800/70">
                        <tr>
                          {[
                            "Codart",
                            "Desart",
                            "Merma%",
                            "Cantidad Teórica",
                            "Validar",
                          ].map((h) => (
                            <th
                              key={h}
                              className="border border-[rgb(var(--border))] p-2 text-center text-xs font-medium uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ingredients.map((ing, index) => (
                          <tr
                            key={`${ing.codart}-${index}`}
                            className="even:bg-[rgb(var(--surface))] odd:bg-[rgb(var(--surface))]"
                          >
                            <td className="border border-[rgb(var(--border))] p-2 text-center">
                              {ing.codart}
                            </td>
                            <td className="border border-[rgb(var(--border))] p-2 text-center">
                              {ing.desart}
                            </td>
                            <td className="border border-[rgb(var(--border))] p-2 text-center">
                              {ing.merma}%
                            </td>
                            <td className="border border-[rgb(var(--border))] p-2 text-center">
                              <Input
                                type="number"
                                step="0.01"
                                size="sm"
                                className="p-1 text-center"
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
                                tone="strong"
                              />
                            </td>
                            <td className="border border-[rgb(var(--border))] p-2 text-center">
                              <Input
                                type="number"
                                step="0.01"
                                size="sm"
                                className="p-1 text-center"
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
                                tone="strong"
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
            <hr className="my-4 border-t border-[rgb(var(--border))] w-full max-w-lg mx-auto opacity-60 dark:border-slate-700" />
            <div className="flex justify-center gap-4 mt-6">
              <Button
                onClick={() => {
                  resetForm();
                  setIsOpen(false);
                }}
                variant="cancel"
                label="Cancelar"
              />
              {canEdit && (
                <Button
                  onClick={handleSubmit}
                  variant="save"
                  label={
                    isSaving
                      ? "Guardando..."
                      : isEditMode
                      ? "Actualizar"
                      : "Crear"
                  }
                />
              )}
            </div>
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
        onDelete={
          canEdit
            ? (id: number) => {
                void handleDelete(id);
              }
            : undefined
        }
        onEdit={(id: number) => {
          void handleEdit(id);
        }}
        onHistory={(id: number) => {
          void handleHistory(id);
        }}
      />
      {auditList.length > 0 && (
        <AuditModal audit={auditList} onClose={() => setAuditList([])} />
      )}
    </div>
  );
}

export default NewAdaptation;
