"use client";

import {
  ToastContainer,
  toast,
  Slide,
  ToastOptions,
  TypeOptions,
  ToastPosition,
} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import Button from "../buttons/buttons";
import Image from "next/image";

/** Clase base con overrides fuertes para que el texto SIEMPRE use --foreground */
const baseToastSurface =
  [
    "rounded-xl shadow-lg flex items-center gap-4 p-5 border backdrop-blur-md z-[9999]",
    "bg-[rgb(var(--surface))] border-[rgb(var(--border))]",
    // 🔥 el truco: forzar color en root y en el body del toast
    "!text-[rgb(var(--foreground))]",
    "[&_.Toastify__toast-body]:!text-[rgb(var(--foreground))]",
  ].join(" ");

/** Borde sutil por tipo */
function toastClassByType(context?: {
  type?: TypeOptions;
  defaultClassName?: string;
  position?: ToastPosition;
  rtl?: boolean;
}) {
  const t = context?.type;
  if (t === "success") return `${baseToastSurface} border-[color:rgb(var(--success))]/30`;
  if (t === "error") return `${baseToastSurface} border-[color:rgb(var(--danger))]/30`;
  if (t === "warning") return `${baseToastSurface} border-[color:rgb(var(--warning))]/30`;
  return baseToastSurface;
}

/** Contenedor */
const Toaster = () => {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      closeOnClick
      pauseOnHover
      draggable
      transition={Slide}
      toastClassName={toastClassByType}
      progressClassName="Toastify__progress-bar bg-[rgb(var(--accent))]"
      closeButton={false}
      newestOnTop
      style={{ zIndex: 9999 }}
      theme="auto"
      // ✅ Inline style gana a casi todo: refuerza fondo/borde/texto
      toastStyle={{
        background: "rgb(var(--surface))",
        color: "rgb(var(--foreground))",
        border: "1px solid rgb(var(--border))",
      }}
    />
  );
};

/** Config común */
const baseConfig: ToastOptions = {
  className: "flex items-center gap-3",
};

/** Íconos (semaforito) */
const IconSuccess = <CheckCircle className="w-6 h-6 text-[rgb(var(--success))]" />;
const IconError = <XCircle className="w-6 h-6 text-[rgb(var(--danger))]" />;
const IconWarn = <AlertTriangle className="w-6 h-6 text-[rgb(var(--warning))]" />;

/** Simples */
export const showSuccess = (message: string) =>
  toast.success(message, { ...baseConfig, icon: IconSuccess });
export const showError = (message: string) =>
  toast.error(message, { ...baseConfig, icon: IconError });
export const showWarning = (message: string) =>
  toast.warning(message, { ...baseConfig, icon: IconWarn });

/** Confirm */
export const showConfirm = (message: string, onConfirm: () => void) => {
  const toastId = toast.info(
    <div className="flex flex-col gap-4 text-sm !text-[rgb(var(--foreground))] text-center">
      <p>{message}</p>
      <div className="flex justify-center gap-2">
        <Button onClick={() => toast.dismiss(toastId)} variant="cancel" label="Cancelar" />
        <Button
          onClick={() => {
            toast.dismiss(toastId);
            onConfirm();
          }}
          variant="create"
          label="Confirmar"
        />
      </div>
    </div>,
    {
      position: "top-center",
      autoClose: false,
      closeOnClick: false,
      closeButton: false,
      className:
        "rounded-xl shadow-md z-[9999] border bg-[rgb(var(--surface))] border-[rgb(var(--border))] !text-[rgb(var(--foreground))] [&_.Toastify__toast-body]:!text-[rgb(var(--foreground))]",
    }
  );
};

/** On session */
export const showOnSession = () =>
  toast.info(
    <div className="flex items-center gap-3">
      <Image src="/animated/feliz.gif" alt="Cargando" width={40} height={40} className="rounded-full" />
      <span>¡Bienvenido a Logipack!</span>
    </div>,
    {
      position: "top-center",
      autoClose: 3000,
      className:
        "rounded-xl shadow-lg z-[9999] border bg-[rgb(var(--surface))] border-[rgb(var(--border))] !text-[rgb(var(--foreground))] [&_.Toastify__toast-body]:!text-[rgb(var(--foreground))]",
    }
  );

/** Off session */
export const showOffSession = () =>
  toast.info(
    <div className="flex items-center gap-3">
      <Image src="/animated/sudor.gif" alt="Cargando" width={40} height={40} className="rounded-full" />
      <span>Cerrando sesión...</span>
    </div>,
    {
      position: "top-center",
      autoClose: 3000,
      className:
        "rounded-xl shadow-lg z-[9999] border bg-[rgb(var(--surface))] border-[rgb(var(--border))] !text-[rgb(var(--foreground))] [&_.Toastify__toast-body]:!text-[rgb(var(--foreground))]",
    }
  );

export default Toaster;
