import React from "react";

function ModalBlock({
    isOpen,
    onClose,
    message,
}: {
    isOpen: boolean;
    onClose: () => void;
    message: string;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white/10 backdrop-blur-2xl border border-white/30 shadow-xl rounded-xl p-6 md:p-8 mx-4 max-w-lg text-white text-center">
                <h2 className="text-2xl font-bold mb-4">🚫 Acceso Restringido</h2>
                <p className="text-base md:text-lg">{message}</p>
            </div>
        </div>
    );
}

export default ModalBlock;
