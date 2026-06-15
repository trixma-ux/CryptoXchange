import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300), // Phone enters
      setTimeout(() => setPhase(2), 1000), // Tickers appear
      setTimeout(() => setPhase(3), 1500), // Headline
      setTimeout(() => setPhase(4), 3800), // Out
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div className="absolute inset-0 flex items-center justify-center"
      {...sceneTransitions.zoomThrough}>
      
      <div className="absolute left-[10%] top-1/2 -translate-y-1/2 w-[40%] z-20">
        <motion.h2 
          className="text-[4vw] leading-[1.1] font-display font-bold text-white mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Real-time<br/>
          <span className="text-primary">Crypto Prices</span>
        </motion.h2>
        
        {/* Simulated Tickers */}
        <div className="space-y-4 mt-8">
          {[
            { pair: 'BTC/XAF', price: '38,450,200', change: '+2.4%' },
            { pair: 'ETH/XAF', price: '1,820,500', change: '+1.8%' },
            { pair: 'USDT/XAF', price: '615.50', change: '0.0%' }
          ].map((ticker, i) => (
            <motion.div 
              key={ticker.pair}
              className="bg-bg-muted/80 backdrop-blur-md p-4 rounded-xl border border-white/10 flex justify-between items-center"
              initial={{ opacity: 0, x: -50 }}
              animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
              transition={{ duration: 0.6, delay: i * 0.15, ease: 'circOut' }}
            >
              <span className="font-bold text-xl">{ticker.pair}</span>
              <div className="text-right">
                <div className="font-mono text-lg">{ticker.price}</div>
                <div className="text-success text-sm">{ticker.change}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div 
        className="absolute right-[15%] top-1/2 -translate-y-1/2 w-[35%] max-w-[400px] z-10"
        initial={{ opacity: 0, y: 100, rotateY: 30 }}
        animate={phase >= 1 ? { opacity: 1, y: 0, rotateY: -10 } : { opacity: 0, y: 100, rotateY: 30 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        style={{ perspective: 1000 }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}phone-mockup.png`} 
          alt="App Mockup" 
          className="w-full h-auto drop-shadow-[0_20px_50px_rgba(245,158,11,0.2)]"
        />
      </motion.div>

    </motion.div>
  );
}