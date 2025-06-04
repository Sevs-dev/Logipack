import React, { useState, useEffect } from "react";
import { getProduct, getProductId, createProduct, updateProduct, deleteProduct, } from "../../services/userDash/productServices";
import Table from "../table/Table";
import { showSuccess, showError, showConfirm } from "../toastr/Toaster";
import Button from "../buttons/buttons"
import { CreateClientProps } from "../../interfaces/CreateClientProps";
import ModalSection from "../modal/ModalSection";
import Text from "../text/Text";
// Definición de la interfaz para un producto
interface Product {
  id: number;
  name: string;
}

function Products({ canEdit = false, canView = false }: CreateClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const columnLabels: { [key: string]: string } = {
    name: "Nombre",
  };
  const columns = ["name"];

  useEffect(() => {
    if (canView) {
      fetchProducts();
    }
  }, [canView]);

  // Obtener la lista de productos
  const fetchProducts = async () => {
    try {
      const data = await getProduct();
      setProducts(data);
    } catch (err) {
      console.error("Error al obtener los productos:", err);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setName("");
    setError("");
    setShowModal(true);
  };


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

  // Crear un producto
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
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

      setProducts((prev) => [...prev, newProduct]); // Actualiza la tabla con el nuevo producto
      await fetchProducts(); // Recargar la lista completa por seguridad
      showSuccess("Producto creado exitosamente");

      // Resetear estado
      setShowModal(false);
      setName("");
      setError("");
    } catch (err) {
      setError("Error al crear el producto");
      console.error(err);
      showError("Ocurrió un error al crear el producto");
    }
  };

  // Actualizar un producto
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
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

      // Resetear estado
      setShowModal(false);
      setName("");
      setError("");
      setEditingProduct(null);
    } catch (err) {
      setError("Error al actualizar el producto");
      console.error(err);
      showError("Ocurrió un error al actualizar el producto");
    }
  };

  // Eliminar un producto
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


  return (
    <div>
      {canEdit && (
        <div className="flex justify-center mb-2">
          <Button onClick={openCreateModal} variant="create" label="Crear Producto" />
        </div>
      )}

      {/* Modal para crear o editar producto */}
      {showModal && (
        <ModalSection isVisible={showModal} onClose={() => setShowModal(false)}>
          <Text type="title">{editingProduct ? "Editar Tipo de Producto" : "Crear Tipo de Producto"}</Text>
          <form onSubmit={editingProduct ? handleUpdate : handleCreate}>
            <div className="mb-4">
              <Text type="subtitle">Nombre del Tipo</Text>
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
            <div className="flex justify-center gap-2 mt-2">
              <Button onClick={() => setShowModal(false)} variant="cancel" />
              {canEdit && (
                <Button type="submit" variant="save" />
              )}
            </div>
          </form>
        </ModalSection>
      )}

      {/* Tabla de productos */}
      <Table
        columns={columns}
        rows={products}
        columnLabels={columnLabels}
        onDelete={canEdit ? handleDelete : undefined}
        onEdit={openEditModal}
      />
    </div>
  );
}

export default Products;
