import React from 'react';
import './Loader.css';

function Loader() {
    return (
        <div className="loader-overlay">
            <div className="three-body">
                <div className="three-body__dot"></div>
                <div className="three-body__dot"></div>
                <div className="three-body__dot"></div>
            </div>
            <div className="loading-text">
                Cargando<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
            </div>
        </div>
    );
}

export default Loader;
