// client/src/components/ContentCarousel.jsx
import { Carousel } from 'flowbite-react';
import { motion } from 'framer-motion';

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

const ContentCarousel = ({ title, items, CardComponent, slideInterval = 5000 }) => {
    if (items.length === 0) {
        return null;
    }

    return (
        <section className="my-12">
            <motion.h2
                variants={itemVariants}
                className="text-3xl sm:text-4xl font-bold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 drop-shadow-md"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
            >
                {title}
            </motion.h2>
            <div className="relative overflow-hidden rounded-xl shadow-lg border border-gray-700 bg-gray-900">
                {/* Custom Carousel styling for better visual appeal */}
                <Carousel slideInterval={slideInterval} className="h-full">
                    {items.map((item) => (
                        <motion.div
                            key={item._id}
                            className="flex justify-center items-center h-full w-full p-4"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* The CardComponent prop is passed the item data */}
                            <CardComponent item={item} />
                        </motion.div>
                    ))}
                </Carousel>
            </div>
        </section>
    );
};

export default ContentCarousel;