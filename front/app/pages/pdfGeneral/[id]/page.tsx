// pages/pdf/PDFPage.tsx
'use client';
import React, { use, useEffect, useState, useRef } from 'react';
import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';
import { getPlanningByIdPDF } from '../../../services/planing/planingServices';
import withAuth from '../../../hooks/withAuth';
import html2pdf from 'html2pdf.js';
import PDFTable from '../../../components/table/PDFTable';
import DateLoader from '@/app/components/loader/DateLoader';

const PDFPage = ({ params }: { params: Promise<{ id: number }> }) => {
  const { id } = use(params);
  const didFetch = useRef(false);
  type Stage = {
    id: number | string;
    description: string;
  };

  type DataType = {
    plan: {
      number_order: string;
      codart: string;
      product_name?: string;
      lot: string;
      expiration?: string;
      quantityToProduce: number;
      bom?: number;
      end_date?: string;
      user: string;
      updated_at?: string;
    };
    cliente: {
      name: string;
    };
    stages: Stage[];
    desart?: string;
    actividadesEjecutadas: {
      id: number;
      description_fase: string;
      forms?: { descripcion_activitie?: string; valor?: string; linea?: string }[];
      user?: string
      created_at?: string;
    }[];
  };

  const [data, setData] = useState<DataType | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

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
      .then((pdf: import('jspdf').jsPDF) => {
        const totalPages = pdf.getNumberOfPages();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight(); // 🔥 obtenemos el alto

        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(10);
          pdf.setTextColor(100);

          const pageText = `Página ${i} de ${totalPages}`;
          const textWidth =
            pdf.getStringUnitWidth(pageText) *
            pdf.getFontSize() /
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
  const { desart } = data;
  const { actividadesEjecutadas } = data;

  const NODES_PER_ROW = 3;
  const NODE_WIDTH = 170;         // Reducido para asegurar que caben
  const H_SPACING = 20;
  const V_SPACING = 140;
  const CONTAINER_WIDTH = 794;

  const nodes = data.stages.map((stage: Stage, index: number) => {
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
        textAlign: 'center' as const,
      },
    };
  });

  const edges = data.stages.slice(1).map((_: Stage, index: number) => ({
    id: `e${data.stages[index].id}-${data.stages[index + 1].id}`,
    source: `${data.stages[index].id}`,
    target: `${data.stages[index + 1].id}`,
    type: 'smoothstep',
    animated: true,
  }));

  const rows = Math.ceil(data.stages.length / NODES_PER_ROW);
  const DYNAMIC_HEIGHT = rows * V_SPACING + 100; // ajusta el extra si lo necesitas


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
          <img
            src="/pharex.png"
            alt="Logo"
            width={120}
            height={80}
            style={{ objectFit: 'contain', position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}
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
              ["Código artículo", plan.codart, "Producto", desart || "No contiene Nombre"],
              ["Lote", plan.lot, "Vence", plan.end_date?.slice(0, 10) || "Sin Fecha"],
              ["Cantidad", `${plan.quantityToProduce} unidades`, "", ""],
            ]}
          />
        </section>

        {plan.bom && (
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
        )}

        <section className="mb-6">
          <h2 className="text-center text-xs font-semibold text-black uppercase tracking-wide border-b border-gray-300 pb-1 mb-2">
            Diagrama de las Operaciones a Realizar
          </h2>

          <div
            style={{
              width: '100%',
              maxWidth: '744px',
              height: DYNAMIC_HEIGHT,
              margin: '0 auto',
              padding: 0,
              boxSizing: 'border-box',
              position: 'relative',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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
                  width: '100%',
                  height: '100%',
                  background: '#fff',
                  pointerEvents: 'none',
                }}
                fitViewOptions={{
                  padding: 0.1,
                  minZoom: 1,
                  maxZoom: 1,
                }}
              />

              {/* 🩹 Overlay anti-marca */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -4,
                  right: -2,
                  width: '100px',
                  height: '30px',
                  backgroundColor: '#fff',
                  zIndex: 10,
                }}
              />
            </div>
          </div>



          <PDFTable
            rows={[["Receta validada por", plan.user, "Fecha", plan.updated_at?.slice(0, 10) || "Sin Fecha"]]}
          />
        </section>

        <>
          <h2 className="text-center text-xs font-semibold text-black uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
            Operaciones ejecutadas
          </h2>
          {actividadesEjecutadas
            .filter((actividad) => Array.isArray(actividad.forms) && actividad.forms.length > 0)
            .map((actividad, index) => (
              <section key={actividad.id} className="mb-4">
                <h4 className="text-center text-xs font-semibold text-black uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
                  {index + 1}. {actividad.description_fase}
                </h4>

                <PDFTable
                  headers={["Actividad", "Resultado", "Línea", "Usuario", "Hora"]}
                  rows={(actividad.forms ?? []).map((form) => {
                    const valor = form.valor;
                    const isImage =
                      typeof valor === "string" &&
                      (valor.startsWith("data:image") || /\.(jpeg|jpg|png|gif|webp)$/i.test(valor));

                    return [
                      form.descripcion_activitie || "Sin descripción",
                      isImage ? (
                        <img
                          src={valor}
                          alt="evidencia"
                          style={{
                            width: "100px",
                            height: "auto",
                            borderRadius: "4px",
                            objectFit: "contain",
                          }}
                        />
                      ) : (
                        valor || ""
                      ),
                      form.linea ?? "",
                      actividad.user ? decodeURIComponent(actividad.user) : "Sin usuario",
                      actividad.created_at ? actividad.created_at.slice(11, 16) : "Sin hora"];
                  })}
                />
              </section>
            ))}

        </>

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