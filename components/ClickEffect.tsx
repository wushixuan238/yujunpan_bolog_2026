import React, { useState, useEffect } from 'react';

interface Click {
    id: number;
    x: number;
    y: number;
}

export const ClickEffect: React.FC = () => {
    const [clicks, setClicks] = useState<Click[]>([]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const newClick = { id: Date.now(), x: e.clientX, y: e.clientY };
            setClicks((prev) => [...prev, newClick]);

            // Remove the click after animation matches duration (1s)
            setTimeout(() => {
                setClicks((prev) => prev.filter((click) => click.id !== newClick.id));
            }, 1000);
        };

        window.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('click', handleClick);
        };
    }, []);

    return (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            {clicks.map((click) => (
                <div
                    key={click.id}
                    className="absolute rounded-full border border-saka-ink/30 opacity-0"
                    style={{
                        left: click.x,
                        top: click.y,
                        width: '20px',
                        height: '20px',
                        transform: 'translate(-50%, -50%)',
                        animation: 'ripple 1s ease-out forwards',
                    }}
                />
            ))}
            <style>{`
        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0.8;
            border-width: 1px;
          }
          100% {
            transform: translate(-50%, -50%) scale(3);
            opacity: 0;
            border-width: 0px;
          }
        }
      `}</style>
        </div>
    );
};
