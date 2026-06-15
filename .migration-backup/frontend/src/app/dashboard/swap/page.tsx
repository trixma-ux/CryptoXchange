'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownUp, RefreshCw, AlertCircle } from 'lucide-react';
import { swapAPI, walletsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatCrypto } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';

export default function SwapPage() {
  const { user } = useAuthStore();
  const [fromCurrency, setFromCurrency] = useState('BTC');
  const [toCurrency, setToCurrency] = useState('USDT_TRC20');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingQuote, setFetchingQuote] = useState(false);
  const [balances, setBalances] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchBalances();
  }, []);

  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0 || fromCurrency === toCurrency) {
      setQuote(null);
      return;
    }
    const timer = setTimeout(() => {
      fetchQuote();
    }, 500);
    return () => clearTimeout(timer);
  }, [amount, fromCurrency, toCurrency]);

  const fetchBalances = async () => {
    try {
      const res = await walletsAPI.getPortfolio();
      const portfolioItems = res.data.data.portfolioItems;
      const newBalances: Record<string, number> = {};
      portfolioItems.forEach((item: any) => {
        newBalances[item.currency] = parseFloat(item.balance);
      });
      setBalances(newBalances);
    } catch (e) {
      // Ignore error for now
    }
  };

  const fetchQuote = async () => {
    setFetchingQuote(true);
    try {
      const res = await swapAPI.getQuote({ fromCurrency, toCurrency, fromAmount: amount });
      setQuote(res.data.data);
    } catch (error) {
      setQuote(null);
    } finally {
      setFetchingQuote(false);
    }
  };

  const executeSwap = async () => {
    if (user?.kycStatus !== 'APPROVED') {
      toast.error('Vous devez vérifier votre identité (KYC) pour effectuer un swap');
      return;
    }

    setLoading(true);
    try {
      await swapAPI.execute({ fromCurrency, toCurrency, fromAmount: amount });
      toast.success(`Swap réussi ! Vous avez reçu ${formatCrypto(quote.toAmount, toCurrency)}`);
      setAmount('');
      setQuote(null);
      fetchBalances(); // Refresh balances
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du swap');
    } finally {
      setLoading(false);
    }
  };

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setAmount('');
    setQuote(null);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="section-title text-center">Échanger (Swap)</h1>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 md:p-8">
        {user?.kycStatus !== 'APPROVED' && (
          <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-xl flex items-start gap-3 text-warning">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-bold">Vérification requise.</span> Vous devez compléter votre profil KYC pour utiliser le Swap.
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* From Currency */}
          <div className="bg-dark-900 p-4 rounded-xl border border-white/5">
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-dark-300">De</label>
              <span className="text-xs text-dark-400">Solde: {balances[fromCurrency] || 0} {fromCurrency}</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-transparent border-none focus:ring-0 text-2xl font-bold w-full text-white placeholder-dark-600 outline-none p-0"
              />
              <select 
                value={fromCurrency} 
                onChange={(e) => setFromCurrency(e.target.value)}
                className="bg-dark-800 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-500 font-bold"
              >
                {['BTC', 'ETH', 'USDT_TRC20', 'BNB', 'SOL'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button 
              onClick={handleSwapCurrencies}
              className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-black shadow-brand hover:scale-110 transition-transform"
            >
              <ArrowDownUp className="w-5 h-5" />
            </button>
          </div>

          {/* To Currency */}
          <div className="bg-dark-900 p-4 rounded-xl border border-white/5">
             <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-dark-300">Vers (Estimé)</label>
              <span className="text-xs text-dark-400">Solde: {balances[toCurrency] || 0} {toCurrency}</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={quote ? quote.toAmount.toFixed(8) : ''}
                readOnly
                placeholder="0.00"
                className="bg-transparent border-none focus:ring-0 text-2xl font-bold w-full text-brand-400 placeholder-dark-600 outline-none p-0"
              />
              <select 
                value={toCurrency} 
                onChange={(e) => setToCurrency(e.target.value)}
                className="bg-dark-800 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-500 font-bold"
              >
                {['BTC', 'ETH', 'USDT_TRC20', 'BNB', 'SOL'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Quote details */}
          <div className="bg-dark-800/50 rounded-xl p-4 text-sm mt-4 min-h-[100px] flex flex-col justify-center relative">
            {fetchingQuote ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-brand-500 animate-spin" />
              </div>
            ) : quote ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-dark-400">Taux de change</span>
                  <span className="text-white font-medium">1 {fromCurrency} = {quote.exchangeRate.toFixed(8)} {toCurrency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Frais ({quote.feePercent}%)</span>
                  <span className="text-white font-medium">{quote.feeInFrom.toFixed(8)} {fromCurrency}</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-dark-500">Entrez un montant pour voir l'estimation</div>
            )}
          </div>

          <button 
            onClick={executeSwap}
            disabled={loading || !quote || user?.kycStatus !== 'APPROVED'}
            className="btn-primary w-full py-4 text-lg mt-6"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Confirmer le Swap'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
