'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import nookies from 'nookies';

const Dashboard = () => {
  const router = useRouter();

  useEffect(() => {
    // Obtener cookies del cliente
    const cookies = nookies.get(null); 
    const token = cookies.token;
    if (!token) {
      router.push('/');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* Área principal del contenido */}
      <main className="flex-1 p-8 ">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Panel de Control</h1>
          <p className="text-gray-600">Bienvenido a tu dashboard.</p>
        </header>

        {/* Sección de widgets */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Widget de Estadísticas */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Estadísticas</h2>
            <p>Datos y métricas de ejemplo.</p>
          </div>

          {/* Widget de Gráficos */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Gráficos</h2>
            <p>Visualización de datos.</p>
          </div>

          {/* Widget adicional: Actividad Reciente */}
          <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Actividad Reciente</h2>
            <p>Historial de actividad y logs recientes.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
