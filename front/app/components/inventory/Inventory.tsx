"use client";

import React, { useState } from "react";
import useUserData from '../../hooks/useUserData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts"; 

// Tipos para los datos
interface DataItem {
  name: string;
  stock: number;
  ventas: number;
  conversionRate?: number; // Tasa de conversión: (ventas / stock) * 100
  cambioConversionRate?: number; // Cambio relativo en la tasa de conversión respecto al mes anterior
}

interface PieDataItem {
  name: string;
  value: number;
}

// Datos iniciales
const initialData: DataItem[] = [
  { name: "Enero", stock: 4000, ventas: 2400 },
  { name: "Febrero", stock: 3000, ventas: 1398 },
  { name: "Marzo", stock: 2000, ventas: 9800 },
  { name: "Abril", stock: 2780, ventas: 3908 },
  { name: "Mayo", stock: 1890, ventas: 4800 },
  { name: "Junio", stock: 2390, ventas: 3800 },
  { name: "Julio", stock: 3490, ventas: 4300 },
];

// Función para calcular métricas
const calculateMetrics = (data: DataItem[]): DataItem[] =>
  data.map((item, index, arr) => {
    const conversionRate = parseFloat(((item.ventas / item.stock) * 100).toFixed(2));
    const cambioConversionRate =
      index > 0
        ? parseFloat(
            (
              ((conversionRate - (arr[index - 1].ventas / arr[index - 1].stock) * 100) /
                ((arr[index - 1].ventas / arr[index - 1].stock) * 100)) *
              100
            ).toFixed(2)
          )
        : 0;

    return {
      ...item,
      conversionRate,
      cambioConversionRate,
    };
  });

// Datos procesados
const data = calculateMetrics(initialData);

// Datos para el gráfico de pastel
const pieData: PieDataItem[] = [
  { name: "Disponible", value: 6000 },
  { name: "Vendido", value: 4000 },
];

// Colores para los gráficos
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"];

export default function Dashboard() {
  const { userName } = useUserData();
  const [activeTab, setActiveTab] = useState("Inventario");

  // Datos simulados para las tarjetas
  const metrics = {
    ingresos: "165k €",
    devoluciones: "22",
    pedidos: "345",
    envios: "220",
  };

  const cumplimientoEntrega = 92;
  const tiempoProcesamiento = 7.5;

  return (
    <div className="p-6 min-h-screen text-gray-800 font-sans">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("Inventario")}
            className={`px-4 py-2 rounded-full ${
              activeTab === "Inventario" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Inventario
          </button>
          <button
            onClick={() => setActiveTab("Pedidos")}
            className={`px-4 py-2 rounded-full ${
              activeTab === "Pedidos" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Pedidos
          </button>
          <button
            onClick={() => setActiveTab("Operaciones")}
            className={`px-4 py-2 rounded-full ${
              activeTab === "Operaciones" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Operaciones
          </button>
        </div>
      </div>

      {/* Sección de tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tarjeta de ingresos */}
        <div className="bg-[#1b1b1b23] p-4 rounded-lg shadow-md border">
          <h2 className="text-lg font-semibold mb-2 text-white">Ingresos</h2>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-white">{metrics.ingresos}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
              <path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm0 18c-4.97 0-9-3.93-9-9s3.93-9 9-9 9 3.93 9 9-3.93 9-9 9z" />
            </svg>
          </div>
          <ResponsiveContainer width="100%" height={50}>
            <LineChart data={[{ value: 100 }, { value: 120 }, { value: 110 }, { value: 130 }]}>
              <Line type="monotone" dataKey="value" stroke="#82ca9d" strokeWidth={2} dot={false} />
              <XAxis hide />
              <YAxis hide />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tarjeta de devoluciones */}
        <div className="bg-[#1b1b1b23] p-4 rounded-lg shadow-md border">
          <h2 className="text-lg font-semibold mb-2 text-white">Devoluciones</h2>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-white">{metrics.devoluciones}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
              <path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm0 18c-4.97 0-9-3.93-9-9s3.93-9 9-9 9 3.93 9 9-3.93 9-9 9z" />
            </svg>
          </div>
          <ResponsiveContainer width="100%" height={50}>
            <LineChart data={[{ value: 20 }, { value: 22 }, { value: 21 }, { value: 23 }]}>
              <Line type="monotone" dataKey="value" stroke="#ff7300" strokeWidth={2} dot={false} />
              <XAxis hide />
              <YAxis hide />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tarjeta de pedidos */}
        <div className="bg-[#1b1b1b23] p-4 rounded-lg shadow-md border">
          <h2 className="text-lg font-semibold mb-2 text-white">Pedidos</h2>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-white">{metrics.pedidos}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
              <path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm0 18c-4.97 0-9-3.93-9-9s3.93-9 9-9 9 3.93 9 9-3.93 9-9 9z" />
            </svg>
          </div>
          <ResponsiveContainer width="100%" height={50}>
            <LineChart data={[{ value: 300 }, { value: 345 }, { value: 320 }, { value: 350 }]}>
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={false} />
              <XAxis hide />
              <YAxis hide />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tarjeta de envíos */}
        <div className="bg-[#1b1b1b23] p-4 rounded-lg shadow-md border">
          <h2 className="text-lg font-semibold mb-2 text-white">Envíos</h2>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-white">{metrics.envios}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
              <path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm0 18c-4.97 0-9-3.93-9-9s3.93-9 9-9 9 3.93 9 9-3.93 9-9 9z" />
            </svg>
          </div>
          <ResponsiveContainer width="100%" height={50}>
            <LineChart data={[{ value: 200 }, { value: 220 }, { value: 210 }, { value: 230 }]}>
              <Line type="monotone" dataKey="value" stroke="#ffc658" strokeWidth={2} dot={false} />
              <XAxis hide />
              <YAxis hide />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sección de gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {/* Gráfico circular: Cumplimiento de entrega */}
        <div className="bg-[#1b1b1b23] p-4 rounded-lg shadow-md border">
          <h2 className="text-lg font-semibold mb-4 text-white">Cumplimiento de Entrega</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[
                  { name: "Cumplimiento", value: cumplimientoEntrega },
                  { name: "No Cumplimiento", value: 100 - cumplimientoEntrega },
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#82ca9d"
                label={({ percent }) => `${(percent! * 100).toFixed(0)}%`}
                labelLine={false}
                dataKey="value"
              >
                <Cell key={`cell-0`} fill="#82ca9d" />
                <Cell key={`cell-1`} fill="#ebebeb" />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#222",
                  borderRadius: "8px",
                  border: "none",
                }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico circular: Tiempo de procesamiento */}
        <div className="bg-[#1b1b1b23] p-4 rounded-lg shadow-md border">
          <h2 className="text-lg font-semibold mb-4 text-white">Tiempo de Procesamiento</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[
                  { name: "Tiempo Promedio", value: tiempoProcesamiento },
                  { name: "Restante", value: 24 - tiempoProcesamiento },
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#ff7300"
                label={({ percent }) => `${(percent! * 24).toFixed(1)}h`}
                labelLine={false}
                dataKey="value"
              >
                <Cell key={`cell-0`} fill="#ff7300" />
                <Cell key={`cell-1`} fill="#ebebeb" />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#222",
                  borderRadius: "8px",
                  border: "none",
                }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de barras: Pedidos hoy */}
        <div className="bg-[#1b1b1b23] p-4 rounded-lg shadow-md col-span-2 border">
          <h2 className="text-lg font-semibold mb-4 text-white">Pedidos Hoy</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="#ccc" tickLine={false} />
              <YAxis stroke="#ccc" axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#222",
                  borderRadius: "8px",
                  border: "none",
                }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#fff" }}
              />
              <Legend verticalAlign="top" align="right" />
              <Bar dataKey="stock" fill="#82ca9d" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ventas" fill="#ff7300" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de barras: Errores por Almacén */}
        <div className="bg-[#1b1b1b23] p-4 rounded-lg shadow-md col-span-2 border">
          <h2 className="text-lg font-semibold mb-4 text-white">Errores por Almacén</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { almacen: "Almacen Central", errores: 5 },
              { almacen: "Almacen Norte", errores: 3 },
              { almacen: "Almacen Sur", errores: 2 },
              { almacen: "Almacen Este", errores: 6 },
            ]}>
              <XAxis dataKey="almacen" stroke="#ccc" tickLine={false} />
              <YAxis stroke="#ccc" axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#222",
                  borderRadius: "8px",
                  border: "none",
                }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#fff" }}
              />
              <Legend verticalAlign="top" align="right" />
              <Bar dataKey="errores" fill="#8884d8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}