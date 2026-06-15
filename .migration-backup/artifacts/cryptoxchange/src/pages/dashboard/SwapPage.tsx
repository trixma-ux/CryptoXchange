import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { swapAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownUp, Loader2, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCrypto } from '@/lib/utils';

const CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', color: '#f7931a' },
  { symbol: 'ETH', name: 'Ethereum', color: '#627eea' },
  { symbol: 'USDT', name: 'Tether', color: '#26a17b' },
  { symbol: 'BNB', name: 'BNB', color: '#f3ba2f' },
  { symbol: 'SOL', name: 'Solana', color: '#9945ff' },
  { symbol: 'LTC', name: 'Litecoin', color: '#bfbbbb' },
  { symbol: 'XRP', name: 'Ripple', color: '#00aae4' },
];

export default function SwapPage() {
  const [fromCrypto, setFromCrypto] = useState('BTC');
  const [toCrypto, setToCrypto] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!amount || isNaN(Number(amount)) || fromCrypto === toCrypto) { setQuote(null); return; }
    const timer = setTimeout(async () => {
      setFetching(true);
      try {
        const r = await swapAPI.getQuote({ fromCurrency: fromCrypto, toCurrency: toCrypto, amount: Number(amount) });
        setQuote(r.data?.data);
      } catch { setQuote(null); } finally { setFetching(false); }
    }, 600);
    return () => clearTimeout(timer);
  }, [amount, fromCrypto, toCrypto]);

  const handleSwapCurrencies = () => {
    const prev = fromCrypto;
    setFromCrypto(toCrypto);
    setToCrypto(prev);
    setQuote(null);
    setAmount('');
  };

  const handleSubmit = async () => {
    if (!quote) return;
    setLoading(true);
    try {
      await swapAPI.execute({ fromCurrency: fromCrypto, toCurrency: toCrypto, amount: Number(amount) });
      toast.success(`Échange ${fromCrypto} → ${toCrypto} effectué !`);
      setAmount(''); setQuote(null);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors de l\'échange');
    } finally { setLoading(false); }
  };

  const fromCryptoData = CRYPTOS.find(c => c.symbol === fromCrypto);
  const toCryptoData = CRYPTOS.find(c => c.symbol === toCrypto);

  return (
    <DashboardLayout title="Échange Crypto (Swap)">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Échanger des Cryptos</h2>
          <p style={{ color: '#94a3b8' }}>Convertissez instantanément entre cryptomonnaies</p>
        </div>

        <div className="glass-card p-6 space-y-4">
          {/* From */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>De</label>
            <div className="flex gap-3">
              <select value={fromCrypto} onChange={e => setFromCrypto(e.target.value)} className="input-field w-40"
                style={{ background: '#1e293b' }}>
                {CRYPTOS.filter(c => c.symbol !== toCrypto).map(c => (
                  <option key={c.symbol} value={c.symbol}>{c.symbol} — {c.name}</option>
                ))}
              </select>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00000000" className="input-field flex-1 font-mono text-lg" />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
            <motion.button whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }} onClick={handleSwapCurrencies}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', cursor: 'pointer' }}>
              <ArrowDownUp className="w-5 h-5 text-black" />
            </motion.button>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
          </div>

          {/* To */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Vers</label>
            <div className="flex gap-3">
              <select value={toCrypto} onChange={e => setToCrypto(e.target.value)} className="input-field w-40"
                style={{ background: '#1e293b' }}>
                {CRYPTOS.filter(c => c.symbol !== fromCrypto).map(c => (
                  <option key={c.symbol} value={c.symbol}>{c.symbol} — {c.name}</option>
                ))}
              </select>
              <div className="input-field flex-1 font-mono text-lg flex items-center" style={{ color: '#94a3b8' }}>
                {quote ? formatCrypto(quote.toAmount || 0, toCrypto) : '—'}
              </div>
            </div>
          </div>

          {/* Quote */}
          <AnimatePresence>
            {fetching && (
              <div className="flex items-center gap-2 p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: '#94a3b8' }}>
                <Loader2 className="w-4 h-4 animate-spin" /> Calcul du taux d'échange...
              </div>
            )}
            {quote && !fetching && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-xl space-y-3" style={{ backgroundColor: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="text-sm font-semibold mb-3" style={{ color: '#fbbf24' }}>Détails de l'échange</div>
                {[
                  ['Taux', `1 ${fromCrypto} = ${quote.rate?.toFixed(8) || '—'} ${toCrypto}`],
                  ['Vous envoyez', `${amount} ${fromCrypto}`],
                  ['Vous recevez', `≈ ${formatCrypto(quote.toAmount || 0, toCrypto)}`],
                  ['Commission', `${quote.fee || 0} ${fromCrypto}`],
                  ['Délai estimé', '< 1 minute'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span style={{ color: '#94a3b8' }}>{label}</span>
                    <span className="font-bold text-white">{value}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={handleSubmit} disabled={!quote || loading} className="btn-primary w-full py-4 text-lg">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Échange en cours...</> : `Échanger ${fromCrypto} → ${toCrypto}`}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
