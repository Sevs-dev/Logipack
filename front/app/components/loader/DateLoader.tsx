import React from 'react';

interface DateLoaderProps {
    message?: string;
    backgroundColor?: string;
    color?: string;
}

function DateLoader({
    message = 'Cargando...',
    backgroundColor = '#242424',
    color = '#ffffff',
}: DateLoaderProps) {
    return (
        <div
            className="flex flex-col justify-center items-center h-screen space-y-4"
            style={{ backgroundColor, color }}
        >
            <span className="loader"></span>
            <p className="text-sm text-gray-300 animate-pulse tracking-wide">{message}</p>

            <style jsx>{`
        .loader {
          display: block;
          width: 84px;
          height: 84px;
          position: relative;
        }

        .loader::before,
        .loader::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: 0;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: ${color};
          transform: translate(-50%, -100%) scale(0);
          animation: push_401 2s infinite linear;
        }

        .loader::after {
          animation-delay: 1s;
        }

        @keyframes push_401 {
          0%,
          50% {
            transform: translate(-50%, 0%) scale(1);
          }
          100% {
            transform: translate(-50%, -100%) scale(0);
          }
        }
      `}</style>
        </div>
    );
}

export default DateLoader;
