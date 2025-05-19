"use client";
import React, { useEffect, useState } from 'react';
import Table from "../table/Table";
import { getConsecutives } from '@/app/services/consecutive/consecutiveServices';

function CreateConsecutive() {
  const [consecutives, setConsecutives] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getConsecutives();
        console.log("Consecutivos:", data);
        setConsecutives(data.consecutives);
      } catch (error) {
        console.error("Error cargando consecutivos:", error);
      }
    };
  
    fetchData();
  }, []);

  const handleDelete = (id: number) => {
    console.log("Eliminar consecutivo con ID:", id);
    // Acá va tu lógica real para eliminar
  };

  const handleEdit = (id: number) => {
    console.log("Editar consecutivo con ID:", id);
    // Acá va tu lógica real para editar
  };

  return (
    <div className="p-4"> 
      <Table
        columns={[ 'prefix', 'year', 'month', 'consecutive', 'user', 'date']}
        rows={consecutives}
        columnLabels={{ 
          prefix: "Prefijo",
          year: "Año",
          month: "Mes",
          consecutive: "Consecutivo",
          user: "Usuario",
          date: "Fecha",
        }}
        onDelete={handleDelete}
        showDeleteButton={false}
        onEdit={handleEdit}
        showEditButton={false}
      />
    </div>
  );
}

export default CreateConsecutive;