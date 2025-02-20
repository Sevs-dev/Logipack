"use client";
import React, { useEffect, useState } from "react";
import Table from "../table/Table";
import { getIngredients } from "../../services/ingredientsService";

interface Ingredient {
  id: string | number;
  data: Record<string, any>;
}

function Ingredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const data = await getIngredients();
        setIngredients(data);
      } catch (error) {
        console.error("Error fetching ingredients:", error);
      }
    };
    fetchIngredients();
  }, []);

  const tableData = ingredients.map((ingredient) => ({
    id: ingredient.id,
    ...ingredient.data
  }));

  const columns = ingredients.length > 0 ? ["id", ...Object.keys(ingredients[0].data)] : [];

  const columnLabels = columns.reduce((acc, column) => {
    acc[column] = column.charAt(0).toUpperCase() + column.slice(1);
    return acc;
  }, {} as Record<string, string>);

  const handleEdit = (id: string | number) => {
    console.log("Editar ingrediente con ID:", id);
  };

  const handleDelete = (id: string | number) => {
    console.log("Eliminar ingrediente con ID:", id);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-7xl mx-auto p-4">
        <div className="bg-[#111827] rounded-lg shadow-lg">
          <div className="p-4">
            <div className="flex justify-end mb-4" />
            {/* Table container with fixed height and horizontal/vertical scroll */}
            <div className="relative">
              <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-300">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden">
                    <Table 
                      rows={tableData}
                      columns={columns}
                      columnLabels={columnLabels}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Ingredients;