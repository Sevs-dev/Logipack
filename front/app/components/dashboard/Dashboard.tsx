'use client';
import React from 'react';
import useUserData from '../../hooks/useUserData';
import { FaUserCircle } from 'react-icons/fa';

const Dashboard = () => {
  const { userName } = useUserData();

  if (!userName) return <p>No estás logueado. Por favor, inicia sesión.</p>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Contenido principal */}
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Panel de Control</h1>
            <p className="text-gray-600 mt-1">Bienvenido de vuelta, {userName}</p>
          </div>
          <div className="md:hidden">
            <FaUserCircle className="text-2xl text-gray-600" />
          </div>
        </header>

        {/* Widgets */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Widget 1 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Usuarios Activos</h2>
            <p className="text-3xl font-bold text-blue-600">1,234</p>
            <p className="text-sm text-gray-500 mt-2">↑ 12% desde la semana pasada</p>
          </div>

          {/* Widget 2 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Ventas Totales</h2>
            <p className="text-3xl font-bold text-green-600">$9,870</p>
            <p className="text-sm text-gray-500 mt-2">↑ 8% en este mes</p>
          </div>

          {/* Widget 3 */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Nuevos Registros</h2>
            <p className="text-3xl font-bold text-purple-600">231</p>
            <p className="text-sm text-gray-500 mt-2">↓ 3% respecto al mes anterior</p>
          </div>
        </section>

        {/* Gráficos / Informes */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4">Gráfico de Ventas</h2>
            <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded-lg text-gray-400">
              [Aquí iría tu gráfico]
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4">Actividad Reciente</h2>
            <ul className="space-y-3 text-sm text-gray-700">
              <li>• Nuevo registro: Juan Pérez - Hoy</li>
              <li>• Compra realizada por Ana G. - Ayer</li>
              <li>• Error en servidor reportado - Hace 2 días</li>
              <li>• Notificación enviada a usuarios premium</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;