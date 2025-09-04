import { useState, useEffect } from "react";
import {
  getProduct,
  getProductId,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../services/userDash/productServices";
import Table from "../table/Table";
import { showSuccess, showError, showConfirm } from "../toastr/Toaster";
import Button from "../buttons/buttons";
import { CreateClientProps } from "../../interfaces/CreateClientProps";
import ModalSection from "../modal/ModalSection";
import Text from "../text/Text";
import AuditModal from "../history/AuditModal";
import { Audit } from "../../interfaces/Audit";
import { Product } from "../../interfaces/Products";
import DateLoader from "@/app/components/loader/DateLoader";
import { Input } from "../inputs/Input";

/**
 * Componente principal para gestionar productos.
 * Permite crear, editar, eliminar y ver historial de productos.
 */
function Products({ canEdit = false, canView = false }: CreateClientProps) {
  // Estado para la lista de productos
  const [products, setProducts] = useState<Product[]>([]);
  // Estado para mostrar/ocultar modal de creación/edición
  const [showModal, setShowModal] = useState(false);
  // Estado para el nombre del producto en el formulario
  const [name, setName] = useState("");
  // Estado para mostrar errores en el formulario
  const [error, setError] = useState("");
  // Estado para saber si se está editando un producto
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  // Estado para la lista de auditorías
  const [auditList, setAuditList] = useState<Audit[]>([]);
  // Estado para la auditoría seleccionada (no se usa, pero se deja para posible ampliación)
  const [isSaving, setIsSaving] = useState(false);

  // Efecto para cargar productos si el usuario puede verlos
  useEffect(() => {
    if (canView) {
      fetchProducts();
    }
  }, [canView]);

  /**
   * Obtiene la lista de productos desde el servicio.
   */
  const fetchProducts = async () => {
    try {
      const data = await getProduct();
      setProducts(data);
    } catch (err) {
      console.error("Error al obtener los productos:", err);
    }
  };

  /**
   * Abre el modal para crear un nuevo producto.
   */
  const openCreateModal = () => {
    setEditingProduct(null);
    setName("");
    setError("");
    setShowModal(true);
  };

  /**
   * Abre el modal para editar un producto existente.
   * @param productId ID del producto a editar
   */
  const openEditModal = async (productId: number) => {
    try {
      const productData = await getProductId(productId);
      if (productData) {
        setEditingProduct(productData);
        setName(productData.name);
        setError("");
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error al obtener el producto:", error);
      setError("No se pudo obtener el producto.");
    }
  };

  /**
   * Maneja la creación de un producto.
   * @param e Evento de formulario
   */
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    if (isSaving) return;
    setIsSaving(true);
    e.preventDefault();
    if (!name) {
      showError("El nombre es requerido");
      return;
    }
    try {
      const newProduct = await createProduct({ name });

      if (!newProduct || !newProduct.id) {
        throw new Error("Error: Producto no creado correctamente");
      }

      setProducts((prev) => [...prev, newProduct]);
      await fetchProducts(); // Refresca la lista completa
      showSuccess("Producto creado exitosamente");

      // Resetea el estado del formulario
      setShowModal(false);
      setName("");
      setError("");
    } catch (err) {
      setError("Error al crear el producto");
      console.error(err);
      showError("Ocurrió un error al crear el producto");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Maneja la actualización de un producto existente.
   * @param e Evento de formulario
   */
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    if (isSaving) return;
    setIsSaving(true);
    e.preventDefault();
    if (!name || !editingProduct) {
      setError("El nombre es requerido");
      return;
    }
    try {
      await updateProduct(editingProduct.id, { name });
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, name } : p))
      );
      showSuccess("Producto actualizado correctamente");

      // Resetea el estado del formulario
      setShowModal(false);
      setName("");
      setError("");
      setEditingProduct(null);
    } catch (err) {
      setError("Error al actualizar el producto");
      console.error(err);
      showError("Ocurrió un error al actualizar el producto");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Maneja la eliminación de un producto.
   * @param id ID del producto a eliminar
   */
  const handleDelete = async (id: number) => {
    try {
      showConfirm("¿Estás seguro de eliminar este producto?", async () => {
        await deleteProduct(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
        showSuccess("Producto eliminado correctamente");
      });
    } catch (err) {
      console.error("Error al eliminar el producto", err);
      showError("No se pudo eliminar el producto");
    }
  };

  // Renderizado del componente
  return (
    <div>
      {/* Botón para crear producto, solo si tiene permisos de edición */}
      {canEdit && (
        <div className="flex justify-center mb-2">
          <Button
            onClick={openCreateModal}
            variant="create"
            label="Crear Tipo de Productos"
          />
        </div>
      )}

      {isSaving && (
        <DateLoader
          message="Cargando..."
          backgroundColor="rgba(0, 0, 0, 0.28)"
          color="rgba(255, 255, 0, 1)"
        />
      )}

      {/* Modal para crear o editar producto */}
      {showModal && (
        <ModalSection isVisible={showModal} onClose={() => setShowModal(false)}>
          <div className="dark:[--surface:30_41_59] dark:[--surface-muted:51_65_85] dark:[--border:71_85_105] dark:[--foreground:241_245_249] dark:[--ring:56_189_248] dark:[--accent:56_189_248]">
            <Text type="title" color="text-[rgb(var(--foreground))]">
              {editingProduct
                ? "Editar Tipo de Producto"
                : "Crear Tipo de Producto"}
            </Text>

            <form
              onSubmit={editingProduct ? handleUpdate : handleCreate}
              className="mt-4 space-y-4"
            >
              <div className="space-y-2">
                <Text type="subtitle" color="text-[rgb(var(--foreground))]">
                  Nombre del Tipo
                </Text>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canEdit}
                  placeholder="Ej. Materia Prima"
                  tone="strong"
                  className="mt-1 text-center"
                  aria-invalid={!!error}
                  aria-describedby={error ? "type-error" : undefined}
                />
              </div>

              {error && (
                <p
                  id="type-error"
                  className="rounded-lg px-3 py-2 text-sm border bg-red-500/10 text-red-600 border-red-200 dark:border-red-400/40"
                >
                  {error}
                </p>
              )}

              <hr className="my-4 border-t border-[rgb(var(--border))]/60 w-full max-w-lg mx-auto opacity-60 dark:border-slate-700" />

              <div className="flex justify-center gap-4 pt-2">
                <Button onClick={() => setShowModal(false)} variant="cancel" />
                {canEdit && (
                  <Button
                    type="submit"
                    variant="save"
                    disabled={isSaving}
                    label={
                      isSaving
                        ? "Guardando..."
                        : editingProduct
                        ? "Actualizar"
                        : "Crear"
                    }
                  />
                )}
              </div>
            </form>
          </div>
        </ModalSection>
      )}

      {/* Tabla de productos */}
      <Table
        columns={["name"]}
        rows={products}
        columnLabels={{ name: "Nombre" }}
        onDelete={canEdit ? handleDelete : undefined}
        onEdit={openEditModal}
      />

      {/* Modal de auditoría */}
      {auditList.length > 0 && (
        <AuditModal audit={auditList} onClose={() => setAuditList([])} />
      )}
    </div>
  );
}

export default Products;
