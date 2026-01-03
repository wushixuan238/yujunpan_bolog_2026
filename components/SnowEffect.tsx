import React, { useEffect, useRef } from 'react';

interface Snowflake {
    x: number;
    y: number;
    radius: number;
    speed: number;
    wind: number;
    opacity: number;
}

export const SnowEffect: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const snowflakes: Snowflake[] = [];
        const snowflakeCount = 100;

        // Initialize snowflakes
        for (let i = 0; i < snowflakeCount; i++) {
            snowflakes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2 + 1,
                speed: Math.random() * 1.5 + 0.5,
                wind: Math.random() * 0.5 - 0.25,
                opacity: Math.random() * 0.5 + 0.3,
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#EBE9E4'; // saka-highlight

            snowflakes.forEach((flake) => {
                ctx.beginPath();
                ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(235, 233, 228, ${flake.opacity})`; // saka-highlight with opacity
                ctx.fill();

                // Update position
                flake.y += flake.speed;
                flake.x += flake.wind;

                // Reset if out of bounds
                if (flake.y > height) {
                    flake.y = -5;
                    flake.x = Math.random() * width;
                }
                if (flake.x > width) {
                    flake.x = 0;
                } else if (flake.x < 0) {
                    flake.x = width;
                }
            });

            animationFrameRef.current = requestAnimationFrame(draw);
        };

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', handleResize);
        draw();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-50 mix-blend-screen"
        />
    );
};
