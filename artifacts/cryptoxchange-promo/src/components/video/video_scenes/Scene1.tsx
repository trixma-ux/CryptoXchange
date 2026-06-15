import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300), // Intro text
      setTimeout(() => setPhase(2), 1200), // Main text
      setTimeout(() => setPhase(3), 2000), // FCFA badge
      setTimeout(() => setPhase(4), 3200), // Out
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div className="absolute inset-0 flex items-center justify-center flex-col text-center px-8"
      {...sceneTransitions.scaleFade}>
      
      <motion.div
        className="mb-6 px-6 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary font-mono text-[1.2vw] tracking-widest uppercase"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        Welcome to CryptoXchange
      </motion.div>

      <div className="relative">
        <motion.h1 
          className="text-[6vw] leading-[1.1] font-display font-bold text-white tracking-tight"
          initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
          animate={phase >= 2 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 40, filter: 'blur(10px)' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Buy & Sell Crypto<br/>
          Directly in <span className="text-primary">FCFA</span>
        </motion.h1>

        <motion.div
          className="absolute -right-[15%] -top-[20%] w-32 h-32 bg-primary/20 blur-2xl rounded-full"
          animate={{ scale: [1, 1.5, 1], opacity: [0, 0.8, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      <motion.p
        className="mt-8 text-[1.8vw] text-text-secondary max-w-3xl"
        initial={{ opacity: 0 }}
        animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        The easiest way to trade cryptocurrency in Cameroon.
      </motion.p>
    </motion.div>
  );
}