import React from 'react';
import { motion } from 'framer-motion';

export default function FluidLoader() {
  return (
    <div className="flex justify-center items-center space-x-1.5 h-5">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-2 h-2 bg-white rounded-full"
          initial={{ opacity: 0.4, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1.2 }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: index * 0.15,
          }}
        />
      ))}
    </div>
  );
}
