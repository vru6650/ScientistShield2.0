// client/src/components/ui/Card.jsx
import { motion } from 'framer-motion';

const Card = ({ children, className }) => (
    <motion.div
        className={`glass-effect rounded-lg p-6 shadow-lg ${className}`}
        whileHover={{ scale: 1.05, rotateY: 10, transition: { duration: 0.3 } }}
    >
        {children}
    </motion.div>
);

export default Card;