import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300), // Mobile money logos
      setTimeout(() => setPhase(2), 1000), // Connecting line
      setTimeout(() => setPhase(3), 1500), // Text
      setTimeout(() => setPhase(4), 3800), // Out
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div className="absolute inset-0 flex items-center justify-center px-16"
      {...sceneTransitions.slideLeft}>
      
      <div className="w-1/2 pr-12 flex flex-col justify-center h-full">
        <motion.h2 
          className="text-[4.5vw] leading-[1.1] font-display font-bold text-white mb-6"
          initial={{ opacity: 0, x: -50 }}
          animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Instant deposits via<br/>
          <span className="text-primary">Mobile Money</span>
        </motion.h2>
        <motion.p
          className="text-[1.8vw] text-text-secondary"
          initial={{ opacity: 0, x: -30 }}
          animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          Seamless integration with MTN MoMo and Orange Money. No complex banking needed.
        </motion.p>
      </div>

      <div className="w-1/2 relative h-full flex items-center justify-center">
        {/* Abstract Mobile Money Representation */}
        <div className="relative w-full max-w-[500px] aspect-square">
          
          <motion.div
            className="absolute top-1/4 left-0 w-32 h-32 rounded-3xl bg-yellow-500 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.3)] z-20"
            initial={{ scale: 0, rotate: -20 }}
            animate={phase >= 1 ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <span className="text-black font-bold text-2xl">MTN</span>
          </motion.div>

          <motion.div
            className="absolute bottom-1/4 right-0 w-32 h-32 rounded-3xl bg-orange-500 flex items-center justify-center shadow-[0_0_50px_rgba(249,115,22,0.3)] z-20"
            initial={{ scale: 0, rotate: 20 }}
            animate={phase >= 1 ? { scale: 1, rotate: 0 } : { scale: 0, rotate: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
          >
            <span className="text-black font-bold text-2xl">ORANGE</span>
          </motion.div>

          {/* Central Exchange Node */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-4 border-primary/50 flex items-center justify-center bg-bg-dark z-10"
            initial={{ scale: 0, opacity: 0 }}
            animate={phase >= 2 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ duration: 0.8, ease: "backOut" }}
          >
            <div className="text-center">
              <span className="text-primary font-bold text-3xl block">FCFA</span>
              <span className="text-white text-sm">Wallet</span>
            </div>
            <motion.div 
              className="absolute inset-[-10px] rounded-full border-2 border-primary/30 border-t-primary"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>

          {/* Connecting lines */}
          <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
            <motion.path 
              d="M 64,30% Q 250,30% 250,50%" 
              fill="none" 
              stroke="var(--color-primary)" 
              strokeWidth="4"
              strokeDasharray="10 10"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={phase >= 2 ? { pathLength: 1, opacity: 0.5 } : { pathLength: 0, opacity: 0 }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
            <motion.path 
              d="M 436,70% Q 250,70% 250,50%" 
              fill="none" 
              stroke="var(--color-primary)" 
              strokeWidth="4"
              strokeDasharray="10 10"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={phase >= 2 ? { pathLength: 1, opacity: 0.5 } : { pathLength: 0, opacity: 0 }}
              transition={{ duration: 1, ease: "easeInOut", delay: 0.2 }}
            />
          </svg>

        </div>
      </div>
    </motion.div>
  );
}