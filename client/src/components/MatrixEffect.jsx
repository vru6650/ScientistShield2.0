// client/src/components/MatrixEffect.jsx

import React, { useRef, useEffect } from 'react';

const MatrixEffect = ({ color = '#00ff41', tailColor = 'rgba(0, 255, 65, 0.5)' }) => {
    const canvasRef = useRef(null);
    const animationFrameId = useRef();

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const fontSize = 20;
        const columns = Math.floor(width / fontSize);

        const drops = Array(columns).fill(null).map(() => ({
            y: 1,
            tailChar: '',
            isNew: true,
        }));

        const characters = '01';

        const draw = () => {
            // Semi-transparent overlay to create the fading effect. Now this background fade color can be customized!
            ctx.fillStyle = 'rgba(14, 28, 45, 0.05)';
            ctx.fillRect(0, 0, width, height);

            for (let i = 0; i < drops.length; i++) {
                const drop = drops[i];

                const gradient = ctx.createLinearGradient(0, (drop.y - 1) * fontSize, 0, drop.y * fontSize);
                gradient.addColorStop(0, tailColor);
                gradient.addColorStop(1, color);

                if (drop.isNew) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.fillText('•', i * fontSize, (drop.y - 2) * fontSize);
                    drop.isNew = false;
                }

                ctx.fillStyle = gradient;
                ctx.fillText(drop.tailChar, i * fontSize, (drop.y - 1) * fontSize);

                ctx.fillStyle = color;
                const text = characters.charAt(Math.floor(Math.random() * characters.length));
                ctx.fillText(text, i * fontSize, drop.y * fontSize);

                drop.tailChar = text;

                if (drop.y * fontSize > height && Math.random() > 0.975) {
                    drop.y = 0;
                    drop.isNew = true;
                }

                drop.y++;
            }
        };

        const animate = () => {
            draw();
            animationFrameId.current = requestAnimationFrame(animate);
        };

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId.current);
            window.removeEventListener('resize', handleResize);
        };
    }, [color, tailColor]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full z-0"
        ></canvas>
    );
};

export default MatrixEffect;