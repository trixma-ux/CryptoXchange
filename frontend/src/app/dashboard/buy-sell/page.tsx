'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownUp, RefreshCw, AlertCircle } from 'lucide-react';
import { tradingAPI, pricesAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatCrypto } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';

const SUPPORTED_CRYPTOS = ['BTC', 'ETH', 'USDT_TRC20', 'BNB', 'SOL'];

export default function BuySellPage() {
  const { user } = useAuthStore();
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [crypto, setCrypto] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [prices, setPrices] = useState<any>({});
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingQuote, setFetchingQuote] = useState(false);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setQuote(null);
      return;
    }
    const timer = setTimeout(() => {
      fetchQuote();
    }, 500); // Debounce
    return () => clearTimeout(timer);
  }, [amount, action, crypto]);

  const fetchPrices = async () => {
    try {
      const res = await pricesAPI.getPrices();
      setPrices(res.data.data.prices);
    } catch (e) {
      console.error('Failed to fetch prices');
    }
  };

  const fetchQuote = async () => {
    setFetchingQuote(true);
    try {
      const params = action === 'BUY' 
        ? { type: 'BUY', currency: crypto, fiatAmount: amount, fiatCurrency: 'XOF' }
        : { type: 'SELL', currency: crypto, cryptoAmount: amount, fiatCurrency: 'XOF' };
      
      const res = await tradingAPI.getQuote(params);
      setQuote(res.data.data);
    } catch (error) {
      setQuote(null);
    } finally {
      setFetchingQuote(false);
    }
  };

  const executeTrade = async () => {
    if (user?.kycStatus !== 'APPROVED') {
      toast.error('Vous devez vérifier votre identité (KYC) pour trader');
      return;
    }

    setLoading(true);
    try {
      if (action === 'BUY') {
        await tradingAPI.buy({ currency: crypto, fiatAmount: amount, fiatCurrency: 'XOF' });
        toast.success(`Achat de ${crypto} réussi !`);
      } else {
        await tradingAPI.sell({ currency: crypto, cryptoAmount: amount, fiatCurrency: 'XOF' });
        toast.success(`Vente de ${crypto} réussie !`);
      }
      setAmount('');
      setQuote(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du trade');
    } finally {
      setLoading(false);
    }
  };

  // Get current price mapping (CoinGecko mapping)
  const getCryptoPrice = (sym: string) => {
    const map: any = { BTC: 'bitcoin', ETH: 'ethereum', USDT_TRC20: 'tether', BNB: 'binancecoin', SOL: 'solana' };
    return prices[map[sym]]?.xof || 0;
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="section-title text-center">Acheter / Vendre Crypto</h1>

      <div className="glass-card p-2 flex rounded-xl">
        <button 
          onClick={() => { setAction('BUY'); setAmount(''); }}
          className={`flex-1 py-3 text-center rounded-lg font-bold transition-all ${action === 'BUY' ? 'bg-success text-white' : 'text-dark-400 hover:text-white'}`}
        >
          Acheter
        </button>
        <button 
          onClick={() => { setAction('SELL'); setAmount(''); }}
          className={`flex-1 py-3 text-center rounded-lg font-bold transition-all ${action === 'SELL' ? 'bg-danger text-white' : 'text-dark-400 hover:text-white'}`}
        >
          Vendre
        </button>
      </div>

      <motion.div key={action} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 md:p-8">
        {user?.kycStatus !== 'APPROVED' && (
          <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-xl flex items-start gap-3 text-warning">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-bold">Vérification requise.</span> Vous devez compléter votre profil KYC pour pouvoir acheter ou vendre des cryptomonnaies.
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Sélectionnez la cryptomonnaie</label>
            <select 
              value={crypto} 
              onChange={(e) => setCrypto(e.target.value)}
              className="input-field appearance-none"
            >
              {SUPPORTED_CRYPTOS.map(c => (
                <option key={c} value={c}>{c} - 1 {c} ≈ {formatCurrency(getCryptoPrice(c), 'XOF')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              {action === 'BUY' ? 'Montant à payer (FCFA)' : `Montant à vendre (${crypto})`}
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input-field text-xl font-medium"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-dark-400">
                {action === 'BUY' ? 'XOF' : crypto}
              </div>
            </div>
          </div>

          {/* Quote Section */}
          <div className="bg-dark-900 rounded-xl p-4 border border-white/5 min-h-[120px] relative">
            {fetchingQuote ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-brand-500 animate-spin" />
              </div>
            ) : quote ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">Taux de change</span>
                  <span className="text-white font-medium">1 {crypto} ≈ {formatCurrency(quote.priceUSD * 605, 'XOF')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Frais estimés ({quote.feePercent}%)</span>
                  <span className="text-white font-medium">{formatCurrency(quote.feeUSD * 605, 'XOF')}</span>
                </div>
                <div className="h-px bg-white/10 my-2"></div>
                <div className="flex justify-between text-base">
                  <span className="text-dark-300 font-medium">Vous {action === 'BUY' ? 'recevrez environ' : 'obtiendrez environ'}</span>
                  <span className="text-brand-400 font-bold">
                    {action === 'BUY' ? formatCrypto(quote.cryptoAmount, crypto) : formatCurrency(quote.fiatAmount, 'XOF')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-dark-500 text-sm">
                Entrez un montant pour voir l'estimation
              </div>
            )}
          </div>

          <button 
            onClick={executeTrade}
            disabled={loading || !quote || user?.kycStatus !== 'APPROVED'}
            className={`w-full py-4 text-lg font-bold rounded-xl flex items-center justify-center gap-2 transition-colors ${
              action === 'BUY' ? 'bg-success hover:bg-emerald-600 text-white' : 'bg-danger hover:bg-red-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : null}
            {action === 'BUY' ? 'Confirmer l\'Achat' : 'Confirmer la Vente'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
