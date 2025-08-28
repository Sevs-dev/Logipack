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
          <Text type="title" color="text-[#000]">
            {formData.id ? "Editar" : "Crear"} Línea
          </Text>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Text type="subtitle" color="#000">
                Nombre de Línea
              </Text>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nombre"
                className="w-full text-black border p-2 mb-3"
                disabled={!canEdit}
              />
            </div>

            <div className="mb-4">
              <Text type="subtitle" color="#000">
                Seleccionar Planta
              </Text>
              <select
                name="factory_id"
                value={formData.factory_id}
                onChange={handleChange}
                className="w-full text-black border p-2 mb-3"
                disabled={!canEdit}
              >
                <option value="">Seleccionar...</option>
                {factories.map((factory) => (
                  <option key={factory.id} value={factory.id}>
                    {factory.name}
                  </option>
                ))}
              </select>
            </div>

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

            <hr className="my-4 border-t border-gray-600 w-full max-w-lg mx-auto opacity-60" />
            <div className="flex justify-center gap-4 mt-6">
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
