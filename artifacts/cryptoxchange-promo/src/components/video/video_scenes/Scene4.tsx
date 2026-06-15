import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400), // Main text
      setTimeout(() => setPhase(2), 1200), // Caisse flow animation
      setTimeout(() => setPhase(3), 2000), // Highlights
      setTimeout(() => setPhase(4), 3800), // Out
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div className="absolute inset-0 flex items-center justify-center flex-col px-12"
      {...sceneTransitions.clipCircle}>
      
      <motion.h2 
        className="text-[4.5vw] text-center leading-[1.1] font-display font-bold text-white mb-12"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.8, ease: "backOut" }}
      >
        Transparent <span className="text-primary">2% Commission</span><br/>
        on all trades
      </motion.h2>

      {/* Caisse Flow Illustration */}
      <div className="relative w-full max-w-4xl h-48 mt-8 flex items-center justify-between">
        
        {/* User Block */}
        <motion.div 
          className="w-48 h-32 bg-bg-muted rounded-2xl border border-white/10 flex flex-col items-center justify-center relative z-10"
          initial={{ opacity: 0, x: -50 }}
          animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-xl font-bold">100,000 FCFA</div>
          <div className="text-sm text-text-muted">Trade Amount</div>
        </motion.div>

        {/* Caisse Block */}
        <motion.div 
          className="w-48 h-32 bg-primary/10 rounded-2xl border border-primary flex flex-col items-center justify-center relative z-10 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
          initial={{ opacity: 0, y: -50 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: -50 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="text-2xl font-bold text-primary">2,000 FCFA</div>
          <div className="text-sm text-primary/80 uppercase tracking-widest mt-1">Caisse</div>
        </motion.div>

        {/* Crypto Block */}
        <motion.div 
          className="w-48 h-32 bg-bg-muted rounded-2xl border border-white/10 flex flex-col items-center justify-center relative z-10"
          initial={{ opacity: 0, x: 50 }}
          animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="text-xl font-bold">0.0024 BTC</div>
          <div className="text-sm text-text-muted">Received</div>
        </motion.div>

        {/* Particles indicating flow */}
        {phase >= 2 && (
          <>
            <motion.div className="absolute top-1/2 left-[20%] w-4 h-4 rounded-full bg-primary"
              initial={{ x: 0, opacity: 0 }}
              animate={{ x: 250, opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div className="absolute top-1/2 right-[20%] w-4 h-4 rounded-full bg-success"
              initial={{ x: 0, opacity: 0 }}
              animate={{ x: 250, opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.75 }}
            />
          </>
        )}
      </div>

    </motion.div>
  );
}