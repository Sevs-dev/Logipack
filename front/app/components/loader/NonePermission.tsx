import React from 'react';
import './NonePermission.css';

const legConfig = [
    { className: 'dog__bl-leg', paw: 'dog__bl-paw', top: 'dog__bl-top' },
    { className: 'dog__fl-leg', paw: 'dog__fl-paw', top: 'dog__fl-top' },
    { className: 'dog__fr-leg', paw: 'dog__fr-paw', top: 'dog__fr-top' },
];

export default function NonePermission() {
    return (
        <div className="contenedor">
            <div className="text">
                <div className="loader__text">
                    <p>Sin Permisos, Para ver esta página, debes comunicarte con un administrador.</p>
                </div>
            </div>
            <div className="main">
                <div className="dog">
                    <div className="dog__paws">
                        {legConfig.map(({ className, paw, top }, index) => (
                            <div className={`${className} leg`} key={index}>
                                <div className={`${paw} paw`} />
                                <div className={`${top} top`} />
                            </div>
                        ))}
                    </div>

                    <div className="dog__body">
                        <div className="dog__tail" />
                    </div>

                    <div className="dog__head">
                        <div className="dog__snout">
                            <div className="dog__eyes">
                                <div className="dog__eye-l" />
                                <div className="dog__eye-r" />
                            </div>
                        </div>
                    </div>

                    <div className="dog__head-c">
                        <div className="dog__ear-r" />
                        <div className="dog__ear-l" />
                    </div>
                </div>
            </div>
        </div>
    );
}
