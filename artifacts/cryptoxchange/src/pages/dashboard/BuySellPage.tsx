import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { tradingAPI, pricesAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpDown, Loader2, ChevronDown, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearch } from 'wouter';

const CRYPTOS = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'LTC', 'XRP', 'ADA', 'DOGE'];
const CRYPTO_NAMES: Record<string, string> = { BTC: 'Bitcoin', ETH: 'Ethereum', USDT: 'Tether', BNB: 'BNB', SOL: 'Solana', LTC: 'Litecoin', XRP: 'Ripple', ADA: 'Cardano', DOGE: 'Dogecoin' };
const CRYPTO_COLORS: Record<string, string> = { BTC: '#f7931a', ETH: '#627eea', USDT: '#26a17b', BNB: '#f3ba2f', SOL: '#9945ff', LTC: '#bfbbbb', XRP: '#00aae4', ADA: '#0033ad', DOGE: '#c2a633' };

export default function BuySellPage() {
  const search = useSearch();
  const initialMode = new URLSearchParams(search).get('mode') === 'sell' ? 'sell' : 'buy';
  const [mode, setMode] = useState<'buy' | 'sell'>(initialMode);
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [amountType, setAmountType] = useState<'fiat' | 'crypto'>('fiat');
  const [quote, setQuote] = useState<any>(null);
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('orange_money');

  useEffect(() => {
    pricesAPI.getPrices().then(r => setPrices(r.data?.data || {})).catch(() => {});
  }, []);

  useEffect(() => {
    if (!amount || isNaN(Number(amount))) { setQuote(null); return; }
    const timer = setTimeout(async () => {
      setFetching(true);
      try {
        const params = amountType === 'fiat'
          ? { currency: selectedCrypto, amountXOF: Number(amount), side: mode.toUpperCase() }
          : { currency: selectedCrypto, amount: Number(amount), side: mode.toUpperCase() };
        const r = await tradingAPI.getQuote(params);
        setQuote(r.data?.data);
      } catch { setQuote(null); } finally { setFetching(false); }
    }, 600);
    return () => clearTimeout(timer);
  }, [amount, selectedCrypto, mode, amountType]);

  const handleSubmit = async () => {
    if (!quote) return;
    setLoading(true);
    try {
      const fn = mode === 'buy' ? tradingAPI.buy : tradingAPI.sell;
      await fn({ currency: selectedCrypto, amountXOF: quote.amountXOF, paymentMethod });
      toast.success(mode === 'buy' ? `${selectedCrypto} acheté avec succès !` : `${selectedCrypto} vendu avec succès !`);
      setAmount(''); setQuote(null);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors de la transaction');
    } finally { setLoading(false); }
  };

  const currentPrice = prices[selectedCrypto];

  return (
    <DashboardLayout title="Acheter / Vendre">
      <div className="max-w-2xl mx-auto">
        {/* Mode Toggle */}
        <div className="glass-card p-1 flex rounded-2xl mb-6">
          {(['buy', 'sell'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
              style={{ background: mode === m ? (m === 'buy' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)') : 'transparent', color: mode === m ? 'white' : '#94a3b8', border: 'none', cursor: 'pointer' }}>
              {m === 'buy' ? '🛒 Acheter' : '💰 Vendre'}
            </button>
          ))}
        </div>

        <div className="glass-card p-6 space-y-6">
          {/* Crypto Selector */}
          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: '#cbd5e1' }}>Cryptomonnaie</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {CRYPTOS.map(c => (
                <button key={c} onClick={() => setSelectedCrypto(c)}
                  className="py-3 px-2 rounded-xl text-sm font-bold transition-all flex flex-col items-center gap-1"
                  style={{ background: selectedCrypto === c ? `${CRYPTO_COLORS[c]}20` : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedCrypto === c ? CRYPTO_COLORS[c] + '60' : 'rgba(255,255,255,0.05)'}`, color: selectedCrypto === c ? CRYPTO_COLORS[c] : '#94a3b8', cursor: 'pointer' }}>
                  <span style={{ fontSize: '18px' }}>{c[0]}</span>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Current Price */}
          {currentPrice && (
            <div className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <span style={{ color: '#94a3b8' }}>Prix {selectedCrypto}</span>
              <div className="text-right">
                <div className="font-bold text-white">{formatCurrency(currentPrice.priceXOF || 0)}</div>
                <div className="text-sm" style={{ color: currentPrice.change24h >= 0 ? '#10b981' : '#ef4444' }}>
                  {currentPrice.change24h >= 0 ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />} {currentPrice.change24h?.toFixed(2)}%
                </div>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: '#cbd5e1' }}>Montant</label>
              <button onClick={() => setAmountType(a => a === 'fiat' ? 'crypto' : 'fiat')} className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'none', cursor: 'pointer' }}>
                <ArrowUpDown className="w-3 h-3" /> {amountType === 'fiat' ? 'Saisir en FCFA' : `Saisir en ${selectedCrypto}`}
              </button>
            </div>
            <div className="relative">
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="input-field pr-20 text-xl font-mono" />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#94a3b8' }}>
                {amountType === 'fiat' ? 'FCFA' : selectedCrypto}
              </div>
            </div>
          </div>

          {/* Payment Method (for buy) */}
          {mode === 'buy' && (
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: '#cbd5e1' }}>Mode de paiement</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'orange_money', label: 'Orange Money' },
                  { id: 'mtn_money', label: 'MTN Money' },
                  { id: 'wave', label: 'Wave' },
                  { id: 'bank_transfer', label: 'Virement bancaire' },
                ].map(p => (
                  <button key={p.id} onClick={() => setPaymentMethod(p.id)}
                    className="py-2.5 px-3 rounded-xl text-sm font-medium transition-all"
                    style={{ background: paymentMethod === p.id ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${paymentMethod === p.id ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.05)'}`, color: paymentMethod === p.id ? '#fbbf24' : '#94a3b8', cursor: 'pointer' }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quote */}
          <AnimatePresence>
            {fetching && (
              <div className="flex items-center gap-2 p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: '#94a3b8' }}>
                <Loader2 className="w-4 h-4 animate-spin" /> Calcul du meilleur taux...
              </div>
            )}
            {quote && !fetching && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="p-5 rounded-xl space-y-3" style={{ backgroundColor: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="text-sm font-semibold mb-3" style={{ color: '#fbbf24' }}>Récapitulatif</div>
                {[
                  ['Vous {action}', `${quote.cryptoAmount} ${selectedCrypto}`, mode === 'buy'],
                  ['Vous payez / recevez', formatCurrency(quote.amountXOF || 0), null],
                  ['Taux de change', `1 ${selectedCrypto} = ${formatCurrency(quote.exchangeRate || 0)}`, null],
                  ['Commission (1.5%)', formatCurrency(quote.fee || 0), null],
                ].map(([label, value, positive]) => (
                  <div key={label as string} className="flex justify-between text-sm">
                    <span style={{ color: '#94a3b8' }}>{(label as string).replace('{action}', mode === 'buy' ? 'recevez' : 'vendez')}</span>
                    <span className="font-bold" style={{ color: positive === null ? 'white' : positive ? '#10b981' : '#ef4444' }}>{value as string}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={!quote || loading} className="btn-primary w-full py-4 text-lg"
            style={{ background: mode === 'buy' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' }}>
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Traitement...</> : mode === 'buy' ? `Acheter ${selectedCrypto}` : `Vendre ${selectedCrypto}`}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
