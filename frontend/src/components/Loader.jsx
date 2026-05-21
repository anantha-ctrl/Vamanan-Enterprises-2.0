import React from 'react';
import { motion } from 'framer-motion';

const Loader = () => {
  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center">
      <div className="relative">
        {/* Pulsing Outer Ring */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute inset-0 bg-gold-primary rounded-full blur-2xl"
        ></motion.div>
        
        {/* Main Logo */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            y: [0, -12, 0]
          }}
          transition={{
            y: {
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut"
            },
            default: {
              duration: 0.5
            }
          }}
          className="w-40 h-40 bg-white border-2 border-gold-primary/30 rounded-[3rem] shadow-[0_20px_50px_rgba(212,175,55,0.15)] flex items-center justify-center relative z-10 overflow-hidden"
        >
           <motion.img 
             src="/vamanan-logo.png" 
             alt="Vamanan Enterprises" 
             className="w-28 h-28 object-contain"
             animate={{ scale: [1, 1.08, 1] }}
             transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
           />
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <p className="text-[10px] font-black text-gold-primary uppercase tracking-[0.4em] mb-1">Vamanan Enterprises</p>
        <div className="flex gap-1 justify-center">
           {[...Array(3)].map((_, i) => (
             <motion.div 
               key={i}
               animate={{ y: [0, -5, 0] }}
               transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
               className="w-1 h-1 bg-gold-primary rounded-full"
             ></motion.div>
           ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Loader;
