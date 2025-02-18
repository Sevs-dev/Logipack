import React from 'react';
import './Loader.css';

function Loader() {
    return (
        <div className="loader-overlay"> 
            <div className="honeycomb">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div className="loading-text">
                Cargando<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
            </div>
        </div>
    );
}

export default Loader;
