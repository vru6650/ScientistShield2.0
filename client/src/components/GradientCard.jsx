// client/src/components/GradientCard.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'flowbite-react';
import { motion } from 'framer-motion';

const GradientCard = ({ title, description, linkTo, gradient }) => {
    return (
        <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
            <Link to={linkTo} className="block w-full h-full">
                <div className={`flex flex-col items-center justify-center p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 text-center ${gradient}`}>
                    <h2 className="text-4xl font-extrabold text-white mb-2">{title}</h2>
                    <p className="text-gray-100 mb-6 text-sm md:text-base">{description}</p>
                    <Button outline className="text-white border-white hover:bg-white hover:text-gray-800 rounded-full">
                        Explore
                    </Button>
                </div>
            </Link>
        </motion.div>
    );
};

export default GradientCard;