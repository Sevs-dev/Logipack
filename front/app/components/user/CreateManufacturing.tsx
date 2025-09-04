"use client";

import { useState, useEffect } from "react";
import {
  createManu,
  getManu,
  getManuId,
  updateManu,
  deleteManu,
} from "../../services/userDash/manufacturingServices";
import ModalSection from "../modal/ModalSection";
import { getProduct } from "../../services/userDash/productServices";
import { getFactory } from "../../services/userDash/factoryServices";
import Table from "../table/Table";
import { showSuccess, showError, showConfirm } from "../toastr/Toaster";
import Button from "../buttons/buttons";
import Text from "../text/Text";
import { Manu, Factory, Product, ManuServ } from "../../interfaces/Products";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
import SelectorDual from "../SelectorDual/SelectorDual";
import AuditModal from "../history/AuditModal";
import { Audit } from "../../interfaces/Audit";
import { getAuditsByModelAdmin } from "../../services/history/historyAuditServices";
import DateLoader from "@/app/components/loader/DateLoader";
import { Input } from "../inputs/Input";

function CreateManufacturing({
  canEdit = false,
  canView = false,
}: CreateClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Manu>({
    name: "",
    products: [],
    factory_id: 0,
  });
  const [factories, setFactories] = useState<Factory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [manu, setManu] = useState<ManuServ[]>([]);
  // Estado para la lista de auditorías
  const [auditList, setAuditList] = useState<Audit[]>([]);
  // Estado para la auditoría seleccionada (no se usa, pero se deja para posible ampliación)
  const [, setSelectedAudit] = useState<Audit | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [productsResponse, manuResponse, factoriesResponse] =
        await Promise.all([getProduct(), getManu(), getFactory()]);

      const manuWithFactoryNames = manuResponse.map((m: Manu) => {
        const factory = (factoriesResponse as Factory[]).find(
          (f: Factory) => f.id === m.factory_id
        );
        return { ...m, factory: factory?.name || "Sin Planta" };
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
    if (canView) {
      fetchData();
    }
  }, [canView]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "factory_id" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (isSaving) return;
    setIsSaving(true);
    e.preventDefault();
    if (
      !formData.name ||
      !formData.factory_id ||
      formData.products.length === 0
    ) {
      showError("Por favor, completa todos los campos antes de guardar.");
      return;
    }

    try {
      if (formData.id) {
        await updateManu(formData.id, formData);
        showSuccess("Línea actualizada correctamente");
      } else {
        await createManu(formData);
        showSuccess("Línea creada correctamente");
      }
      await fetchData();
      closeModal();
    } catch (error) {
      console.error("Error al guardar manufactura", error);
      showError("No se pudo guardar la manufactura");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    showConfirm("¿Estás seguro de eliminar esta manufactura?", async () => {
      try {
        await deleteManu(id);
        setManu((prev) => prev.filter((m) => m.id !== id));
        showSuccess("Línea eliminada correctamente");
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
      if (!data)
        return showError("No se encontraron datos para esta manufactura.");

      setFormData({
        ...data,
        products: Array.isArray(data.products)
          ? data.products
          : JSON.parse(data.products),
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error al obtener los datos de la manufactura:", error);
      showError("No se pudieron cargar los datos de la manufactura.");
    }
  };

  const closeModal = () => setIsModalOpen(false);
  const handleHistory = async (id: number) => {
    const model = "Manufacturing";
    try {
      const data = await getAuditsByModelAdmin(model, id);
      setAuditList(data);
      if (data.length > 0) setSelectedAudit(data[0]);
    } catch (error) {
      console.error("Error al obtener la auditoría:", error);
    }
  };

  return (
    <div>
      {canEdit && (
        <div className="flex justify-center mb-2">
          <Button onClick={openModal} variant="create" label="Crear Línea" />
        </div>
      )}
      {isSaving && (
        <DateLoader
          message="Cargando..."
          backgroundColor="rgba(0, 0, 0, 0.28)"
          color="rgba(255, 255, 0, 1)"
        />
      )}
      {isModalOpen && (
        <ModalSection isVisible={isModalOpen} onClose={closeModal}>
          <div className="dark:[--surface:30_41_59] dark:[--surface-muted:51_65_85] dark:[--border:71_85_105] dark:[--foreground:241_245_249] dark:[--ring:56_189_248] dark:[--accent:56_189_248]">
            <Text type="title" color="text-[rgb(var(--foreground))]">
              {formData.id ? "Editar" : "Crear"} Línea
            </Text>

            <form onSubmit={handleSubmit} className="mt-4 space-y-5">
              {/* Nombre de línea */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Nombre de Línea
                </Text>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nombre"
                  disabled={!canEdit}
                  tone="strong"
                  className="mt-1 text-center"
                />
              </div>

              {/* Seleccionar planta */}
              <div>
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Seleccionar Planta
                </Text>
                <select
                  name="factory_id"
                  value={formData.factory_id}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className={[
                    "mt-1 w-full p-3 rounded-xl text-center transition",
                    "bg-[rgb(var(--surface))] text-[rgb(var(--foreground))]",
                    "border border-[rgb(var(--border))]",
                    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2 focus:ring-offset-transparent",
                    !canEdit
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:shadow-sm",
                    "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
                  ].join(" ")}
                >
                  <option
                    value=""
                    className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))]"
                  >
                    Seleccionar...
                  </option>
                  {factories.map((factory) => (
                    <option
                      key={factory.id}
                      value={factory.id}
                      className="bg-[rgb(var(--surface))] text-[rgb(var(--foreground))]"
                    >
                      {factory.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Productos */}
              <div>
                <SelectorDual
                  titulo="Productos"
                  disponibles={products}
                  seleccionados={products.filter((p) =>
                    formData.products.includes(p.id)
                  )}
                  onAgregar={(item) => {
                    if (!formData.products.includes(item.id)) {
                      setFormData((prev) => ({
                        ...prev,
                        products: [...prev.products, item.id],
                      }));
                    }
                  }}
                  onQuitar={(id) => {
                    setFormData((prev) => ({
                      ...prev,
                      products: prev.products.filter((pid) => pid !== id),
                    }));
                  }}
                />
              </div>

              <hr className="my-2 border-t border-[rgb(var(--border))]/60 w-full max-w-lg mx-auto opacity-60 dark:border-slate-700" />

              {/* Acciones */}
              <div className="flex justify-center gap-4 pt-2">
                <Button onClick={closeModal} variant="cancel" />
                {canEdit && (
                  <Button
                    type="submit"
                    disabled={isSaving}
                    label={
                      isSaving
                        ? "Guardando..."
                        : formData.id
                        ? "Actualizar"
                        : "Crear"
                    }
                    variant="save"
                  />
                )}
              </div>
            </form>
          </div>
        </ModalSection>
      )}

      <Table
        columns={["name", "factory"]}
        rows={manu}
        columnLabels={{ name: "Nombre", factory: "Planta" }}
        onDelete={canEdit ? handleDelete : undefined}
        onEdit={openEditModal}
        onHistory={handleHistory}
      />

      {/* Modal de auditoría */}
      {auditList.length > 0 && (
        <AuditModal audit={auditList} onClose={() => setAuditList([])} />
      )}
    </div>
  );
}

export default CreateManufacturing;
