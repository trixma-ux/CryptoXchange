'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Bitcoin, AlertCircle, RefreshCw } from 'lucide-react';
import { paymentsAPI, transactionsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';

const PROVIDERS = ['ORANGE_MONEY', 'MTN_MONEY', 'WAVE', 'MOOV_MONEY', 'AIRTEL_MONEY'];
const CRYPTOS = ['BTC', 'ETH', 'USDT_TRC20', 'BNB', 'SOL'];

export default function WithdrawPage() {
  const { user } = useAuthStore();
  const [method, setMethod] = useState<'MOBILE_MONEY' | 'CRYPTO'>('MOBILE_MONEY');
  
  // Mobile money state
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [phone, setPhone] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [cryptoCurrency, setCryptoCurrency] = useState('USDT_TRC20');
  const [loading, setLoading] = useState(false);

  // Crypto withdrawal state
  const [cryptoOut, setCryptoOut] = useState('USDT_TRC20');
  const [amountOut, setAmountOut] = useState('');
  const [addressOut, setAddressOut] = useState('');
  const [networkOut, setNetworkOut] = useState('TRON');

  const handleMobileMoneyWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.kycStatus !== 'APPROVED') {
      toast.error('KYC requis pour le retrait Mobile Money');
      return;
    }
    setLoading(true);
    try {
      await paymentsAPI.mobileMoneyWithdrawal({
        provider,
        phoneNumber: phone,
        cryptoAmount,
        cryptoCurrency,
        fiatCurrency: 'XOF'
      });
      toast.success('Demande de retrait soumise. Validation en cours.');
      setCryptoAmount('');
      setPhone('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la demande');
    } finally {
      setLoading(false);
    }
  };

  const handleCryptoWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.kycStatus !== 'APPROVED') {
      toast.error('KYC requis pour le retrait Crypto');
      return;
    }
    setLoading(true);
    try {
      await transactionsAPI.cryptoWithdrawal({
        currency: cryptoOut,
        amount: amountOut,
        toAddress: addressOut,
        network: networkOut
      });
      toast.success('Demande de retrait crypto soumise.');
      setAmountOut('');
      setAddressOut('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du retrait');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="section-title text-center">Faire un Retrait</h1>

      <div className="glass-card p-2 flex rounded-xl mb-6">
        <button 
          onClick={() => setMethod('MOBILE_MONEY')}
          className={`flex-1 py-3 text-center rounded-lg font-bold transition-all flex justify-center items-center gap-2 ${method === 'MOBILE_MONEY' ? 'bg-dark-800 text-white shadow-lg' : 'text-dark-400 hover:text-white'}`}
        >
          <Smartphone className="w-5 h-5" /> Vers Mobile Money
        </button>
        <button 
          onClick={() => setMethod('CRYPTO')}
          className={`flex-1 py-3 text-center rounded-lg font-bold transition-all flex justify-center items-center gap-2 ${method === 'CRYPTO' ? 'bg-dark-800 text-white shadow-lg' : 'text-dark-400 hover:text-white'}`}
        >
          <Bitcoin className="w-5 h-5" /> Retrait Crypto
        </button>
      </div>

      <motion.div key={method} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 md:p-8">
        {user?.kycStatus !== 'APPROVED' && (
           <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-xl flex items-start gap-3 text-warning">
             <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
             <div className="text-sm">
               <span className="font-bold">KYC Requis.</span> Vérifiez votre identité pour pouvoir effectuer des retraits.
             </div>
           </div>
        )}

        {method === 'MOBILE_MONEY' ? (
          <form onSubmit={handleMobileMoneyWithdraw} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Fournisseur de destination</label>
              <select value={provider} onChange={e => setProvider(e.target.value)} className="input-field">
                {PROVIDERS.map(p => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Numéro de téléphone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ex: 0700000000" className="input-field" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Vendre (Crypto)</label>
                <select value={cryptoCurrency} onChange={e => setCryptoCurrency(e.target.value)} className="input-field font-bold text-lg">
                  {CRYPTOS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Quantité à vendre</label>
                <input type="number" step="0.00000001" value={cryptoAmount} onChange={e => setCryptoAmount(e.target.value)} placeholder="0.00" className="input-field font-bold text-lg" required />
              </div>
            </div>

            <button type="submit" disabled={loading || user?.kycStatus !== 'APPROVED'} className="btn-primary w-full py-4 text-lg mt-4">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Demander le Retrait'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCryptoWithdraw} className="space-y-5">
             <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Cryptomonnaie</label>
              <select value={cryptoOut} onChange={e => setCryptoOut(e.target.value)} className="input-field">
                {CRYPTOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Réseau Blockchain</label>
              <input type="text" value={networkOut} onChange={e => setNetworkOut(e.target.value)} placeholder="Ex: TRON, ETHEREUM" className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Adresse de destination</label>
              <input type="text" value={addressOut} onChange={e => setAddressOut(e.target.value)} placeholder="Collez l'adresse ici" className="input-field font-mono text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Montant</label>
              <input type="number" step="0.00000001" value={amountOut} onChange={e => setAmountOut(e.target.value)} placeholder="0.00" className="input-field font-bold text-lg" required />
            </div>
            
            <div className="bg-dark-900 rounded-xl p-4 text-sm text-warning border border-warning/20">
              Assurez-vous que l'adresse de destination correspond bien au réseau sélectionné. Les fonds envoyés sur le mauvais réseau peuvent être perdus définitivement.
            </div>

            <button type="submit" disabled={loading || user?.kycStatus !== 'APPROVED'} className="btn-primary w-full py-4 text-lg mt-4">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Retirer les Cryptos'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
