"use client";

import { ToastContainer, toast, Slide, ToastOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import Button from "../buttons/buttons";

// Clase de estilo común para todos los toasts
const commonToastClass =
  "bg-white/10 text-gray-100 rounded-xl shadow-lg flex items-center gap-4 p-5 border border-white/20 backdrop-blur-lg";

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
    />
  );
};

// Configuración base para los toasts
const baseConfig: ToastOptions = {
  className: "flex items-center gap-3",
};

export const showSuccess = (message: string) =>
  toast.success(message, {
    ...baseConfig,
    icon: <CheckCircle className="text-green-400 w-6 h-6" />,
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

export const showConfirm = (message: string, onConfirm: () => void) => {
  const toastId = toast.info(
    <div className="flex flex-col gap-4 text-sm text-gray-900 dark:text-gray-900 text-center">
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
      className: "bg-[#fff] border border-gray-300 dark:border-gray-700 rounded-xl shadow-md",
    }
  );
};

export default Toaster;
