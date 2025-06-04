import React from 'react';
import './NonePermission.css';

export default function NonePermission() {
    return (
        <div className="contenedor">
            <div className="text">
                <div className="loader__text">
                    <p>Sin Permisos. Para ver esta página, debes comunicarte con un administrador.</p>
                </div>
            </div>
            <span className="loader"></span>
        </div>
    );
}
