import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500), // Logo
      setTimeout(() => setPhase(2), 1200), // Tagline
      setTimeout(() => setPhase(3), 2000), // URL
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div className="absolute inset-0 flex items-center justify-center flex-col text-center"
      {...sceneTransitions.morphExpand}>
      
      <div className="relative mb-8">
        <motion.div
          className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.h1 
          className="text-[7vw] font-display font-black text-white tracking-tighter relative z-10"
          initial={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
          animate={phase >= 1 ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          Crypto<span className="text-primary">X</span>change
        </motion.h1>
      </div>

      <motion.p
        className="text-[2vw] text-text-secondary mb-12 font-medium"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        Secure. Fast. Local.
      </motion.p>

      <motion.div
        className="px-8 py-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10"
        initial={{ opacity: 0, y: 30 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <span className="text-2xl font-mono tracking-wider text-primary">cryptoxchange.cm</span>
      </motion.div>

    </motion.div>
  );
}