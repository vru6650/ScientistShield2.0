import { motion, useMotionValue, useTransform } from 'framer-motion';
import { HiSun, HiMoon } from 'react-icons/hi2';

const CircularSlider = ({
                            value,
                            min = 0,
                            max = 100,
                            onChange,
                            icon: Icon,
                            label,
                            color = 'bg-sky-500',
                        }) => {
    const y = useMotionValue(0);
    const progress = useTransform(y, (v) => (v / -100) * (max - min));

    const handleDrag = (event, info) => {
        const newProgress = Math.min(Math.max(info.offset.y / -100, 0), 1);
        const newValue = min + newProgress * (max - min);
        onChange(newValue);
    };

    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative h-32 w-16">
                <div className="absolute inset-x-0 top-0 h-full w-2 mx-auto rounded-full bg-slate-200/70 dark:bg-slate-700/50" />
                <motion.div
                    className={`absolute inset-x-0 bottom-0 w-2 mx-auto rounded-full ${color}`}
                    style={{ height: `${percentage}%` }}
                />
                <motion.div
                    drag="y"
                    dragConstraints={{ top: -100, bottom: 0 }}
                    dragElastic={0}
                    dragSnapToOrigin
                    onDrag={handleDrag}
                    className="absolute top-full left-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white dark:bg-slate-300 shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center"
                    style={{ y: `-${percentage}%` }}
                >
                    {Icon && <Icon className="h-4 w-4 text-slate-600" />}
                </motion.div>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
        </div>
    );
};

export default CircularSlider;