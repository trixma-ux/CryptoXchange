'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Bitcoin, AlertCircle, RefreshCw } from 'lucide-react';
import { paymentsAPI, transactionsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';

const PROVIDERS = ['ORANGE_MONEY', 'MTN_MONEY', 'WAVE', 'MOOV_MONEY', 'AIRTEL_MONEY'];
const CRYPTOS = ['BTC', 'ETH', 'USDT_TRC20', 'BNB', 'SOL'];

export default function DepositPage() {
  const { user } = useAuthStore();
  const [method, setMethod] = useState<'MOBILE_MONEY' | 'CRYPTO'>('MOBILE_MONEY');
  
  // Mobile money state
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [cryptoCurrency, setCryptoCurrency] = useState('USDT_TRC20');
  const [loading, setLoading] = useState(false);

  // Crypto deposit state
  const [depositCrypto, setDepositCrypto] = useState('BTC');

  const handleMobileMoneyDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.kycStatus !== 'APPROVED') {
      toast.error('KYC requis pour le dépôt Mobile Money');
      return;
    }
    setLoading(true);
    try {
      await paymentsAPI.mobileMoneyDeposit({
        provider,
        phoneNumber: phone,
        amount,
        currency: 'XOF',
        cryptoCurrency
      });
      toast.success('Dépôt initié. Confirmez sur votre téléphone.');
      setAmount('');
      setPhone('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du dépôt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="section-title text-center">Faire un Dépôt</h1>

      <div className="glass-card p-2 flex rounded-xl mb-6">
        <button 
          onClick={() => setMethod('MOBILE_MONEY')}
          className={`flex-1 py-3 text-center rounded-lg font-bold transition-all flex justify-center items-center gap-2 ${method === 'MOBILE_MONEY' ? 'bg-brand-500 text-black' : 'text-dark-400 hover:text-white'}`}
        >
          <Smartphone className="w-5 h-5" /> Mobile Money
        </button>
        <button 
          onClick={() => setMethod('CRYPTO')}
          className={`flex-1 py-3 text-center rounded-lg font-bold transition-all flex justify-center items-center gap-2 ${method === 'CRYPTO' ? 'bg-brand-500 text-black' : 'text-dark-400 hover:text-white'}`}
        >
          <Bitcoin className="w-5 h-5" /> Crypto Direct
        </button>
      </div>

      <motion.div key={method} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 md:p-8">
        {method === 'MOBILE_MONEY' ? (
          <div>
            {user?.kycStatus !== 'APPROVED' && (
              <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-xl flex items-start gap-3 text-warning">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-bold">KYC Requis.</span> Vérifiez votre identité pour utiliser Mobile Money.
                </div>
              </div>
            )}

            <form onSubmit={handleMobileMoneyDeposit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Fournisseur</label>
                <select value={provider} onChange={e => setProvider(e.target.value)} className="input-field">
                  {PROVIDERS.map(p => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Numéro de téléphone</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="Ex: 0700000000" 
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Montant (FCFA)</label>
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    placeholder="10000" 
                    className="input-field font-bold text-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Acheter (Crypto)</label>
                  <select value={cryptoCurrency} onChange={e => setCryptoCurrency(e.target.value)} className="input-field font-bold text-lg">
                    {CRYPTOS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-dark-900 rounded-xl p-4 text-sm text-dark-300 border border-white/5">
                Une fois initié, un popup s'affichera sur votre téléphone pour confirmer le paiement par code PIN.
              </div>

              <button 
                type="submit" 
                disabled={loading || user?.kycStatus !== 'APPROVED'} 
                className="btn-primary w-full py-4 text-lg"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Initier le Paiement'}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <p className="text-dark-300">Pour déposer directement en crypto, veuillez vous rendre sur la page de vos portefeuilles et cliquer sur "Recevoir" sur la cryptomonnaie de votre choix.</p>
            <a href="/dashboard/wallets" className="btn-secondary inline-flex">
              Aller à mes portefeuilles
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
}
