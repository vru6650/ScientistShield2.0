import { Link } from 'react-router-dom';
import { Button } from 'flowbite-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useState, useRef } from 'react';
import { HiArrowRight } from 'react-icons/hi2';
import * as SiIcons from 'react-icons/si';

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

// A mapping of technology titles to their corresponding icon components
const iconMap = {
    "HTML": SiIcons.SiHtml5,
    "CSS": SiIcons.SiCss3,
    "JavaScript": SiIcons.SiJavascript,
    "Python": SiIcons.SiPython,
    "C++": SiIcons.SiCplusplus,
    "Java": SiIcons.SiJava,
    "C": SiIcons.SiC,
    "C#": SiIcons.SiCsharp,
    "Go": SiIcons.SiGo,
    "SQL": SiIcons.SiSqlite,
    "Delphi/Object Pascal": SiIcons.SiDelphi,
    "Visual Basic": SiIcons.SiVuedotjs,
};

const CategoryCard = ({ title, description, linkTo, gradient }) => {
    const cardRef = useRef(null);
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const [isHovering, setIsHovering] = useState(false);

    const Icon = iconMap[title];

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
    const shadowOpacity = useSpring(isHovering ? 0.4 : 0.1, { stiffness: 300, damping: 10 });

    return (
        <Link to={linkTo} className="block w-full h-full">
            <motion.div
                ref={cardRef}
                className={`relative flex flex-col items-center justify-center p-8 rounded-xl overflow-hidden transition-shadow duration-300 text-center ${gradient}`}
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
                    boxShadow: useTransform(shadowOpacity, (o) => `0 15px 30px rgba(0,0,0,${o})`),
                    perspective: 1000
                }}
            >
                {/* Add a motion.div for the icon */}
                {Icon && (
                    <motion.div
                        className="mb-4"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        whileHover={{ rotate: 5, scale: 1.1 }}
                    >
                        <Icon size={60} className="text-white relative z-10" />
                    </motion.div>
                )}

                <h2 className="text-3xl font-bold text-white mb-2 relative z-10">{title}</h2>
                <p className="text-gray-100 mb-4 text-sm relative z-10">{description}</p>
                <Button outline className="text-white border-white hover:bg-white hover:text-gray-800 relative z-10">
                    Learn {title}
                    <HiArrowRight className="ml-2" />
                </Button>

                <motion.div
                    className="absolute inset-0 z-0 rounded-xl"
                    animate={{
                        backgroundImage: isHovering ?
                            "linear-gradient(45deg, #10b981, #3b82f6, #8b5cf6, #ec4899)" :
                            "linear-gradient(45deg, transparent, transparent, transparent, transparent)"
                    }}
                    transition={{ duration: 0.5 }}
                />
            </motion.div>
        </Link>
    );
};

export default CategoryCard;