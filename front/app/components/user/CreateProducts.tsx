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
import { getAuditsByModelAdmin } from "../../services/history/historyAuditServices";
import AuditModal from "../history/AuditModal";
import { Audit } from "../../interfaces/Audit";
import { Product } from "../../interfaces/Products";

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
  const [, setSelectedAudit] = useState<Audit | null>(null);
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

  /**
   * Maneja la visualización del historial de auditoría de un producto.
   * @param id ID del producto
   */
  const handleHistory = async (id: number) => {
    const model = "Products";
    try {
      const data = await getAuditsByModelAdmin(model, id);
      setAuditList(data);
      if (data.length > 0) setSelectedAudit(data[0]);
    } catch (error) {
      console.error("Error al obtener la auditoría:", error);
    }
  };

  // Renderizado del componente
  return (
    <div>
      {/* Botón para crear producto, solo si tiene permisos de edición */}
      {canEdit && (
        <div className="flex justify-center mb-2">
          <Button onClick={openCreateModal} variant="create" label="Crear Tipo de Productos" />
        </div>
      )}

      {/* Modal para crear o editar producto */}
      {showModal && (
        <ModalSection isVisible={showModal} onClose={() => setShowModal(false)}>
          <Text type="title" color="text-[#000]">{editingProduct ? "Editar Tipo de Producto" : "Crear Tipo de Producto"}</Text>
          <form onSubmit={editingProduct ? handleUpdate : handleCreate}>
            <div className="mb-4">
              <Text type="subtitle" color="#000" >Nombre del Tipo</Text>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-black px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-center"
                disabled={!canEdit}
              />
            </div>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <hr className="my-4 border-t border-gray-600 w-full max-w-lg mx-auto opacity-60" />
            <div className="flex justify-center gap-4 mt-6">
              <Button onClick={() => setShowModal(false)} variant="cancel" />
              {canEdit && (
                <Button type="submit" variant="save" label={isSaving ? "Guardando..." : "Guardando"} disabled={isSaving} />
              )}
            </div>
          </form>
        </ModalSection>
      )}

      {/* Tabla de productos */}
      <Table
        columns={["name"]}
        rows={products}
        columnLabels={{ name: "Nombre" }}
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

export default Products;
