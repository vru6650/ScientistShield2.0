// client/src/hooks/use3DTilt.js

import { useRef, useState } from 'react';
import { useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * A custom hook to create a 3D tilt effect on an element based on mouse position.
 * @param {number} tiltFactor The sensitivity of the tilt effect.
 * @returns {object} An object containing the motion props to apply to your element.
 */
export const use3DTilt = (tiltFactor = 5) => {
    const ref = useRef(null);
    const [isHovering, setIsHovering] = useState(false);

    const mouseX = useMotionValue(0.5); // Initialize to center
    const mouseY = useMotionValue(0.5); // Initialize to center

    const rotateX = useSpring(useTransform(mouseY, [0, 1], [-tiltFactor, tiltFactor]), {
        stiffness: 400,
        damping: 20,
    });
    const rotateY = useSpring(useTransform(mouseX, [0, 1], [tiltFactor, -tiltFactor]), {
        stiffness: 400,
        damping: 20,
    });

    // Animate box shadow to follow the tilt, creating a dynamic 3D effect
    const boxShadowX = useTransform(mouseX, [0, 1], ['-20px', '20px']);
    const boxShadowY = useTransform(mouseY, [0, 1], ['20px', '-20px']);
    const boxShadow = useTransform(
        [boxShadowX, boxShadowY],
        ([x, y]) => `${x} ${y} 30px rgba(0, 0, 0, 0.4)`
    );

    const handleMouseMove = (e) => {
        if (!isHovering || !ref.current) return;
        const { clientX, clientY } = e;
        const { top, left, width, height } = ref.current.getBoundingClientRect();
        const x = (clientX - left) / width;
        const y = (clientY - top) / height;
        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => {
        setIsHovering(false);
        mouseX.set(0.5);
        mouseY.set(0.5);
    };

    return {
        ref,
        style: {
            rotateX,
            rotateY,
            boxShadow: isHovering ? boxShadow : '0px 10px 30px rgba(0, 0, 0, 0.2)',
            transformOrigin: 'center',
            perspective: '1000px',
        },
        onMouseMove: handleMouseMove,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
    };
};