import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

const steps = [
  { icon: '🪪', label: 'National ID', status: 'Upload' },
  { icon: '🤳', label: 'Selfie', status: 'Verify' },
  { icon: '✅', label: 'Approved', status: 'Done' },
];

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2200),
      setTimeout(() => setPhase(4), 3400),
      setTimeout(() => setPhase(5), 4800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center flex-col px-12"
      {...sceneTransitions.slideUp}
    >
      <motion.div
        className="mb-4 px-5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-mono text-[1vw] tracking-widest uppercase"
        initial={{ opacity: 0, y: 16 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.5 }}
      >
        Identity Verification
      </motion.div>

      <motion.h2
        className="text-[4vw] leading-[1.1] font-display font-bold text-white text-center mb-3"
        initial={{ opacity: 0, y: 30 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="text-primary">KYC</span> in Under 2 Minutes
      </motion.h2>

      <motion.p
        className="text-[1.5vw] text-text-secondary mb-10 text-center"
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Secure, simple identity check required by Cameroonian regulations
      </motion.p>

      {/* Step cards */}
      <div className="flex gap-6 items-stretch justify-center w-full max-w-3xl">
        {steps.map((step, i) => {
          const isActive = phase >= i + 2;
          const isCompleted = phase >= i + 3;
          return (
            <motion.div
              key={step.label}
              className="flex-1 bg-bg-muted rounded-2xl border flex flex-col items-center justify-center py-8 px-4 relative overflow-hidden"
              style={{
                borderColor: isCompleted ? 'rgba(245,158,11,0.6)' : isActive ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)',
                boxShadow: isCompleted ? '0 0 24px rgba(245,158,11,0.15)' : 'none',
              }}
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={isActive ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.85, y: 30 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
            >
              {isCompleted && (
                <motion.div
                  className="absolute inset-0 bg-primary/5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                />
              )}

              <div className="text-[4vw] mb-3">{step.icon}</div>
              <div className="text-[1.8vw] font-bold text-white mb-1">{step.label}</div>
              <motion.div
                className="text-[1.1vw] font-mono uppercase tracking-widest"
                style={{ color: isCompleted ? '#10b981' : 'rgba(255,255,255,0.4)' }}
              >
                {isCompleted ? '✓ Done' : step.status}
              </motion.div>

              {/* Scan line animation */}
              {isActive && !isCompleted && (
                <motion.div
                  className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent"
                  initial={{ top: '10%', opacity: 0 }}
                  animate={{ top: ['10%', '90%', '10%'], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Verified badge */}
      <motion.div
        className="mt-8 flex items-center gap-3 px-6 py-3 rounded-full bg-success/10 border border-success/40"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={phase >= 5 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <motion.div
          className="w-5 h-5 rounded-full bg-success flex items-center justify-center text-white text-xs font-bold"
          animate={phase >= 5 ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          ✓
        </motion.div>
        <span className="text-success font-semibold text-[1.4vw]">Account Verified — Ready to Trade</span>
      </motion.div>
    </motion.div>
  );
}
