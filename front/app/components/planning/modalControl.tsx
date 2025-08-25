"use client";

type ModalControlProps = {
  id?: number | null;
  showModal?: boolean;                 
  setShowModal?: (v: boolean) => void;  
  title?: string;
  className?: string;
};

export default function ModalControl({
  id,
  title,
  className,
}: ModalControlProps) {
  const heading =
    title ?? (id != null ? "Editar Control de Proceso" : "Nuevo Control de Proceso");

  return (
    <div className={className ?? "w-full max-w-5xl"}>
      <h3 className="text-lg font-semibold text-black">{heading}</h3> 
    </div>
  );
}
