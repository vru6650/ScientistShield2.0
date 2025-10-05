import { Link } from 'react-router-dom';
import { Button } from 'flowbite-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useState, useRef } from 'react';
import { HiArrowRight } from 'react-icons/hi2';
import {
    SiHtml5,
    SiCss3,
    SiJavascript,
    SiPython,
    SiCplusplus,
    SiOpenjdk,
    SiC,
    SiCsharp,
    SiGo,
    SiSqlite,
    SiDelphi,
    SiVisualstudio,
    SiReact,
    SiNodedotjs,
} from 'react-icons/si';

const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
        },
    },
};

// Map technology titles to react-icons/si icon names (strings).
// Using string indirection avoids Rollup warnings for non-existent exports.
const iconMap = {
    HTML: SiHtml5,
    CSS: SiCss3,
    'JavaScript': SiJavascript,
    Python: SiPython,
    'C++': SiCplusplus,
    Java: SiOpenjdk,
    C: SiC,
    'C#': SiCsharp,
    Go: SiGo,
    SQL: SiSqlite,
    'Delphi/Object Pascal': SiDelphi,
    'Visual Basic': SiVisualstudio,
    'React.js': SiReact,
    'Node.js': SiNodedotjs,
};

const CategoryCard = ({ title, description, linkTo, gradient }) => {
    const cardRef = useRef(null);
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const [isHovering, setIsHovering] = useState(false);

    const Icon = iconMap[title];
    const accentClass = gradient || 'bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600';

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const { clientX, clientY } = e;
        const { top, left, width, height } = cardRef.current.getBoundingClientRect();
        mouseX.set((clientX - left) / width);
        mouseY.set((clientY - top) / height);
    };

    const rotateX = useSpring(useTransform(mouseY, [0, 1], [-8, 8]), { stiffness: 250, damping: 15 });
    const rotateY = useSpring(useTransform(mouseX, [0, 1], [8, -8]), { stiffness: 250, damping: 15 });
    const scale = useSpring(isHovering ? 1.05 : 1, { stiffness: 300, damping: 10 });
    const shadowOpacity = useSpring(isHovering ? 0.55 : 0.16, { stiffness: 300, damping: 14 });

    return (
        <Link to={linkTo} className="block w-full h-full">
            <motion.div
                ref={cardRef}
                className="relative flex flex-col items-center justify-center gap-3 p-8 rounded-3xl overflow-hidden border border-white/70 bg-white/85 text-center shadow-[0_28px_70px_-48px_rgba(39,47,138,0.38)] transition-transform duration-300 backdrop-blur-xl dark:border-ink-800/70 dark:bg-ink-900/75"
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onMouseMove={handleMouseMove}
                style={{
                    rotateX,
                    rotateY,
                    scale,
                    boxShadow: useTransform(shadowOpacity, (o) => `0 26px 55px rgba(39,47,138,${o})`),
                    perspective: 1000
                }}
            >
                {/* Add a motion.div for the icon */}
                {Icon && (
                    <motion.div
                        className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-[0_18px_35px_-20px_rgba(39,47,138,0.6)] ${accentClass}`}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        whileHover={{ rotate: 5, scale: 1.1 }}
                    >
                        <Icon size={40} className="text-white relative z-10" />
                    </motion.div>
                )}

                <h2 className="text-2xl font-semibold text-ink-900 dark:text-ink-100 mb-1 relative z-10">{title}</h2>
                <p className="text-ink-600 dark:text-ink-300/80 mb-4 text-sm relative z-10 leading-relaxed">
                    {description}
                </p>
                <Button
                    color="light"
                    className="relative z-10 rounded-full border border-brand-300/70 bg-white/60 px-5 py-2 text-sm font-semibold text-brand-600 transition-all duration-200 hover:bg-brand-500 hover:text-white dark:border-brand-500/50 dark:bg-ink-900/70 dark:text-brand-300 dark:hover:bg-brand-500/80"
                >
                    Learn {title}
                    <HiArrowRight className="ml-2" />
                </Button>

                <motion.div
                    className="absolute inset-0 z-0 rounded-3xl"
                    animate={{ opacity: isHovering ? 0.7 : 0 }}
                    style={{
                        background: isHovering
                            ? 'linear-gradient(135deg, rgba(108,133,255,0.18), rgba(45,212,191,0.16), rgba(242,107,42,0.14))'
                            : 'transparent',
                    }}
                    transition={{ duration: 0.4 }}
                />
            </motion.div>
        </Link>
    );
};

export default CategoryCard;
