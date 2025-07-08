// pages/pdf/PDFPage.tsx
'use client';
import React, { use, useEffect, useState, useRef } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { getPlanningByIdPDF } from '../../../services/planing/planingServices';
import withAuth from '../../../hooks/withAuth';
import html2pdf from 'html2pdf.js';
import PDFTable from '../../../components/table/PDFTable';
import DateLoader from '@/app/components/loader/DateLoader';

const PDFPage = ({ params }: { params: Promise<{ id: number }> }) => {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getPlanningByIdPDF(id);
        console.log('Datos obtenidos:', response);
        setData(response);
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      }
    };

    fetchData();
  }, [id]);

  const handleDownload = () => {
    if (!pdfRef.current) return;

    const opt = {
      margin: 0.5,
      filename: `plan-${id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 4, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css'] },
    };

    html2pdf()
      .from(pdfRef.current)
      .set(opt)
      .toPdf()
      .get('pdf')
      .then((pdf: any) => {
        const totalPages = pdf.internal.getNumberOfPages();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight(); // 🔥 obtenemos el alto

        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(10);
          pdf.setTextColor(100);

          const pageText = `Página ${i} de ${totalPages}`;
          const textWidth =
            pdf.getStringUnitWidth(pageText) *
            pdf.internal.getFontSize() /
            pdf.internal.scaleFactor;

          const x = pageWidth - textWidth - 0.5;
          const y = pageHeight - 0.5; // ⬅️ ahora va al fondo

          pdf.text(pageText, x, y);
        }
      })
      .save();
  };

  if (!data) {
    return (
      <DateLoader message="Generando PDF..." backgroundColor="#242424" color="#ffff" />
    );
  }

  const { plan } = data;

  const NODES_PER_ROW = 3;
  const NODE_WIDTH = 170;         // Reducido para asegurar que caben
  const H_SPACING = 20;
  const V_SPACING = 140;
  const CONTAINER_WIDTH = 794;

  const nodes = data.stages.map((stage: any, index: number) => {
    const row = Math.floor(index / NODES_PER_ROW);
    const col = index % NODES_PER_ROW;

    const remaining = data.stages.length - row * NODES_PER_ROW;
    const nodesInRow = remaining >= NODES_PER_ROW ? NODES_PER_ROW : remaining;

    const totalRowWidth = nodesInRow * NODE_WIDTH + (nodesInRow - 1) * H_SPACING;
    const startX = (CONTAINER_WIDTH - totalRowWidth) / 2;

    const x = startX + col * (NODE_WIDTH + H_SPACING);
    const y = row * V_SPACING;

    return {
      id: `${stage.id}`,
      data: { label: stage.description },
      position: { x, y },
      style: {
        width: NODE_WIDTH,
        border: '1px solid #3b82f6',
        borderRadius: 8,
        padding: 6,
        fontSize: 11,
        background: '#fff',
        color: '#1e3a8a',
        textAlign: 'center',
      },
    };
  });

  const edges = data.stages.slice(1).map((_: any, index: number) => ({
    id: `e${data.stages[index].id}-${data.stages[index + 1].id}`,
    source: `${data.stages[index].id}`,
    target: `${data.stages[index + 1].id}`,
    type: 'smoothstep',
    animated: true,
  }));

  return (
    <div className="p-6">
      <div
        ref={pdfRef}
        className="bg-white text-slate-800 mx-auto font-sans shadow-lg rounded-md relative"
        style={{
          width: '100%',
          maxWidth: '794px',
          padding: '48px',
          fontSize: '13px',
          lineHeight: '1.7',
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        }}
      >
        <header className="mb-6 border-b border-gray-200 pb-4 flex items-center justify-center relative">
          {/* Logo a la izquierda, fuera del flujo del centrado */}
          <img
            src="/pharex.png"
            alt="Logo"
            className="h-10 object-contain absolute left-0 top-1/2 -translate-y-1/2"
          />

          {/* Título perfectamente centrado */}
          <h1 className="text-xl font-semibold text-gray-800 tracking-wide text-center">
            Batch Record de Producción
          </h1>
        </header>

        <section className="mb-6">
          <PDFTable rows={[["Orden", plan.number_order, "Cliente", data.cliente.name]]} />
        </section>

        <section className="mb-2">
          <h2 className="text-center text-xs font-semibold text-black uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
            Producto a Obtener
          </h2>
          <PDFTable
            rows={[
              ["Código artículo", plan.codart, "Producto", plan.product_name || "Nombre del producto"],
              ["Lote", plan.lot, "Vence", plan.expiration || "01/01/2026"],
              ["Cantidad", `${plan.quantityToProduce} unidades`, "", ""],
            ]}
          />
        </section>

        <section className="mb-2">
          <h2 className="text-center text-xs font-semibold text-black uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
            Materiales Requeridos (BOM)
          </h2>
          <PDFTable
            headers={["Artículo", "Descripción", "Cantidad", "Lote"]}
            rows={[
              ["MAT-001", "Ingrediente Activo", "100 kg", "L-2024-A"],
              ["MAT-002", "Excipiente", "50 kg", "L-2024-B"],
            ]}
          />
        </section>

        <section className="mb-6">
          <h2 className="text-center text-xs font-semibold text-black uppercase tracking-wide border-b border-gray-300 pb-1 mb-2">
            Diagrama de las Operaciones a Realizar
          </h2>

          <div
            style={{
              width: '744px',
              height: 260,
              overflow: 'hidden',
              margin: '0 auto 0 -48px',
              padding: 0,
              boxSizing: 'border-box',
              position: 'relative', // 🔑 Necesario para que el overlay funcione
              background: '#fff',
            }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              nodesDraggable={false}
              panOnScroll={false}
              panOnDrag={false}
              zoomOnScroll={false}
              zoomOnPinch={false}
              style={{
                width: '744px',
                height: 260,
                background: '#fff',
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
              fitViewOptions={{
                padding: 0,
                minZoom: 1,
                maxZoom: 1,
              }}
            />

            {/* 🩹 Overlay para cubrir la marca */}
            <div
              style={{
                position: 'absolute',
                bottom: -4,     // Ajustalo según el caso exacto
                right: -2,
                width: '100px',
                height: '30px',
                backgroundColor: '#fff',
                zIndex: 10, // Asegura que esté por encima
              }}
            />
          </div>

          <PDFTable
            rows={[["Receta validada por", plan.codart, "Fecha", plan.codart]]}
          />
        </section>

        <section className="mb-2">
          <h2 className="text-center text-xs font-semibold text-black uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
            Operaciones
          </h2>
          <h4 className="text-center text-xs font-semibold text-black uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
            1. Despeje de Línea
          </h4>
          <PDFTable
            rows={[
              ["Línea", plan.codart, "Producto anterior", plan.codart],
              [
                { content: "Equipo", props: { className: "font-medium bg-gray-50 text-center" } },
                { content: plan.codart, props: { colSpan: 3 } },
              ],
            ]}
          />
        </section>

        <section className="mb-2">
          <h2 className="text-center text-xs font-semibold text-black uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
            2.1. Usuarios en Línea
          </h2>
          <PDFTable
            headers={["#", "Usuario", "Fecha", "Hora Inicio", "Hora Fin"]}
            rows={[["1", plan.codart, plan.codart, plan.codart, plan.codart]]}
          />
        </section>

        <section className="mb-4">
          <h2 className="text-center text-xs font-semibold text-black uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
            2.2. Despeje de Línea
          </h2>
          {/* Contenedor horizontal */}
          <div className="flex gap-4 mb-3">
            {/* Textarea */}
            <textarea
              className="w-1/2 h-28 border border-gray-300 rounded p-2 text-sm resize-none"
              placeholder="Observaciones del despeje..."
            ></textarea>
            {/* Tabla pequeña al lado derecho */}
            <div className="w-1/2">
              <PDFTable rows={[[plan.codart]]} />
            </div>
          </div>
          {/* Tabla completa debajo */}
          <PDFTable
            headers={["Realizado Por", "Firma", "Fecha", "Hora"]}
            rows={[[plan.codart, plan.codart, plan.codart, plan.codart]]}
          />
        </section>

        <section className="mb-2">
          <h2 className="text-center text-xs font-semibold text-black uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
            3. Operación: Marcación UI
          </h2>
          <h2 className="text-center text-xs font-semibold text-black uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
            3.1. Ajustes de Equipo
          </h2>
          <PDFTable
            headers={["Realizado Por", "Firma", "Fecha", "Hora"]}
            rows={[[plan.codart, plan.codart, plan.codart, plan.codart]]}
          />
        </section>

        <section className="mb-2">
          <h2 className="text-center text-xs font-semibold text-black uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
            3.2. Verificación de Testigos
          </h2>
          <img src="/pharex.png" alt="Diagrama de operaciones" className="w-full max-h-56 object-contain mb-3 border rounded" />
          <h5 className="text-center text-[10px] text-black uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
            Foto del testigo
          </h5>
          <PDFTable
            headers={["Realizado Por", "Firma", "Fecha", "Hora"]}
            rows={[[plan.codart, plan.codart, plan.codart, plan.codart]]}
          />
          <PDFTable
            headers={["Verificado por", "Firma", "Fecha", "Hora"]}
            rows={[[plan.codart, plan.codart, plan.codart, plan.codart]]}
          />
        </section>

        <section className="mb-2">
          <h2 className="text-center text-xs font-semibold text-black uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
            3.3 Controles de Proceso
          </h2>
          <PDFTable
            headers={["Realizado Por", "Firma", "Fecha", "Hora"]}
            rows={[[plan.codart, plan.codart, plan.codart, plan.codart]]}
          />
        </section>

        <section className="mb-2">
          <h2 className="text-center text-xs font-semibold text-black uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
            3. Operación: Marcación UI
          </h2>
          <h2 className="text-center text-xs font-semibold text-black uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
            3.1. Ajustes de Equipo
          </h2>
          <PDFTable
            headers={["Realizado Por", "Firma", "Fecha", "Hora"]}
            rows={[[plan.codart, plan.codart, plan.codart, plan.codart]]}
          />
        </section>

        <footer className="mt-12 pt-3 border-t border-gray-300 text-center text-[10px] text-gray-500">
          Documento generado automáticamente – Pharex S.A.
        </footer>

      </div>

      <div className="text-center mt-6">
        <button
          onClick={handleDownload}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Descargar PDF
        </button>
      </div>
    </div>
  );
};

export default withAuth(PDFPage);