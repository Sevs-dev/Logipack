"use client";

import { ToastContainer, toast, Slide, ToastOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import Button from "../buttons/buttons";
import Image from "next/image";

// Estilos base para el toast (visibles en temas oscuros o claros)
const commonToastClass =
  "bg-white text-gray-900 rounded-xl shadow-lg flex items-center gap-4 p-5 border border-gray-300 backdrop-blur-md z-[9999]";

// Componente contenedor del sistema de toasts
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
      toastClassName={() => commonToastClass}
      closeButton={false}
      newestOnTop
      style={{ zIndex: 9999 }} // 👈 Esto asegura que esté sobre todo
    />
  );
};

// Configuración base
const baseConfig: ToastOptions = {
  className: "flex items-center gap-3",
};

// Toasts simples
export const showSuccess = (message: string) =>
  toast.success(message, {
    ...baseConfig,
    icon: <CheckCircle className="text-green-500 w-6 h-6" />,
  });

export const showError = (message: string) =>
  toast.error(message, {
    ...baseConfig,
    icon: <XCircle className="text-red-500 w-6 h-6" />,
  });

export const showWarning = (message: string) =>
  toast.warning(message, {
    ...baseConfig,
    icon: <AlertTriangle className="text-yellow-400 w-6 h-6" />,
  });

// Toast con botones de confirmación
export const showConfirm = (message: string, onConfirm: () => void) => {
  const toastId = toast.info(
    <div className="flex flex-col gap-4 text-sm text-gray-900 text-center">
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
      className: "bg-white text-gray-900 border border-gray-300 rounded-xl shadow-md z-[9999]",
    }
  );
};

// Toast animado para inicio de sesión
export const showOnSession = () =>
  toast.info(
    <div className="flex items-center gap-3">
      <Image
        src="/animated/feliz.gif"
        alt="Cargando"
        width={40}
        height={40}
        className="rounded-full"
      />
      <span>¡Bienvenido a Logipack!</span>
    </div>,
    {
      position: "top-center",
      autoClose: 3000,
      className: "bg-white text-gray-900 rounded-xl shadow-lg z-[9999]",
    }
  );

// Toast animado para cierre de sesión
export const showOffSession = () =>
  toast.info(
    <div className="flex items-center gap-3">
      <Image
        src="/animated/sudor.gif"
        alt="Cargando"
        width={40}
        height={40}
        className="rounded-full"
      />
      <span>Cerrando sesión...</span>
    </div>,
    {
      position: "top-center",
      autoClose: 3000,
      className: "bg-white text-gray-900 rounded-xl shadow-lg z-[9999]",
    }
  );

export default Toaster;
