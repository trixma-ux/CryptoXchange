import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { paymentsAPI, transactionsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle, Smartphone, Building2, Bitcoin, AlertTriangle } from 'lucide-react';

const MOBILE_PROVIDERS = ['orange_money', 'mtn_money', 'wave', 'moov_money', 'airtel_money'];
const MOBILE_LABELS: Record<string, string> = { orange_money: 'Orange Money', mtn_money: 'MTN Money', wave: 'Wave', moov_money: 'Moov Money', airtel_money: 'Airtel Money' };
const CRYPTOS = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'LTC'];
const METHODS = [
  { id: 'mobile_money', label: 'Mobile Money', icon: Smartphone, desc: 'Retrait en FCFA' },
  { id: 'bank_transfer', label: 'Virement bancaire', icon: Building2, desc: 'Retrait en FCFA' },
  { id: 'crypto', label: 'Crypto directe', icon: Bitcoin, desc: 'Retrait crypto' },
];

export default function WithdrawPage() {
  const [method, setMethod] = useState('mobile_money');
  const [provider, setProvider] = useState('orange_money');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleMobileMoneyWithdraw = async () => {
    if (!amount || !phone) { toast.error('Remplissez tous les champs'); return; }
    if (Number(amount) < 1000) { toast.error('Montant minimum : 1 000 FCFA'); return; }
    setLoading(true);
    try {
      await paymentsAPI.mobileMoneyWithdrawal({ provider, phone, amount: Number(amount) });
      setSuccess(true);
      toast.success('Demande de retrait envoyée !');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors du retrait');
    } finally { setLoading(false); }
  };

  const handleCryptoWithdraw = async () => {
    if (!amount || !address) { toast.error('Remplissez tous les champs'); return; }
    setLoading(true);
    try {
      await transactionsAPI.cryptoWithdrawal({ currency: selectedCrypto, amount: Number(amount), address });
      setSuccess(true);
      toast.success('Retrait crypto soumis !');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors du retrait');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <DashboardLayout title="Retrait">
        <div className="max-w-2xl mx-auto">
          <div className="glass-card p-12 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <CheckCircle className="w-20 h-20 mx-auto mb-6" style={{ color: '#10b981' }} />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-2">Demande envoyée !</h3>
            <p className="mb-6" style={{ color: '#94a3b8' }}>Votre retrait est en cours de traitement. Vous serez notifié une fois validé.</p>
            <button onClick={() => { setSuccess(false); setAmount(''); setPhone(''); setAddress(''); }}
              className="btn-primary">Nouveau retrait</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Retrait">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Effectuer un Retrait</h2>
          <p style={{ color: '#94a3b8' }}>Choisissez votre méthode de retrait</p>
        </div>

        <div className="p-4 rounded-xl mb-6 flex items-start gap-3" style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#f59e0b' }} />
          <div className="text-sm" style={{ color: '#fbbf24' }}>Les retraits sont traités manuellement par l'équipe. Délai : 24-48h ouvrées. Des frais de 1.5% s'appliquent.</div>
        </div>

        {/* Method Selector */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {METHODS.map(({ id, label, icon: Icon, desc }) => (
            <button key={id} onClick={() => { setMethod(id); setSuccess(false); }}
              className="p-4 rounded-2xl text-left transition-all"
              style={{ background: method === id ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${method === id ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer' }}>
              <Icon className="w-6 h-6 mb-2" style={{ color: method === id ? '#fbbf24' : '#94a3b8' }} />
              <div className="text-sm font-bold" style={{ color: method === id ? '#fbbf24' : 'white' }}>{label}</div>
              <div className="text-xs mt-1" style={{ color: '#64748b' }}>{desc}</div>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {method === 'mobile_money' && (
            <motion.div key="mobile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#cbd5e1' }}>Opérateur</label>
                <div className="grid grid-cols-2 gap-2">
                  {MOBILE_PROVIDERS.map(p => (
                    <button key={p} onClick={() => setProvider(p)}
                      className="py-2.5 px-3 rounded-xl text-sm font-medium transition-all"
                      style={{ background: provider === p ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${provider === p ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.05)'}`, color: provider === p ? '#fbbf24' : '#94a3b8', cursor: 'pointer' }}>
                      {MOBILE_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Numéro de téléphone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+225 07 00 00 00 00" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Montant (FCFA)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Minimum : 1 000 FCFA" className="input-field" />
                <div className="flex gap-2 mt-2">
                  {[5000, 10000, 25000, 50000].map(v => (
                    <button key={v} onClick={() => setAmount(String(v))}
                      className="text-xs px-3 py-1 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>
                      {v.toLocaleString('fr-FR')}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleMobileMoneyWithdraw} disabled={loading} className="btn-primary w-full py-4">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Traitement...</> : `Retirer via ${MOBILE_LABELS[provider]}`}
              </button>
            </motion.div>
          )}

          {method === 'bank_transfer' && (
            <motion.div key="bank" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-6 space-y-5">
              {[
                { label: 'Nom du titulaire', placeholder: 'Jean Dupont', type: 'text' },
                { label: 'IBAN / Numéro de compte', placeholder: 'CI77 0001 0601...', type: 'text' },
                { label: 'BIC/SWIFT', placeholder: 'ECOCCIABXXX', type: 'text' },
                { label: 'Montant (FCFA)', placeholder: 'Minimum : 5 000 FCFA', type: 'number' },
              ].map(({ label, placeholder, type }) => (
                <div key={label}>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>{label}</label>
                  <input type={type} placeholder={placeholder} className="input-field" />
                </div>
              ))}
              <button disabled={loading} className="btn-primary w-full py-4">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Traitement...</> : 'Soumettre la demande'}
              </button>
            </motion.div>
          )}

          {method === 'crypto' && (
            <motion.div key="crypto" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#cbd5e1' }}>Cryptomonnaie</label>
                <div className="flex flex-wrap gap-2">
                  {CRYPTOS.map(c => (
                    <button key={c} onClick={() => setSelectedCrypto(c)}
                      className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                      style={{ background: selectedCrypto === c ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedCrypto === c ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.05)'}`, color: selectedCrypto === c ? '#fbbf24' : '#94a3b8', cursor: 'pointer' }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Adresse de destination</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder={`Adresse ${selectedCrypto}...`} className="input-field font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Montant ({selectedCrypto})</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00000000" className="input-field font-mono" />
              </div>
              <button onClick={handleCryptoWithdraw} disabled={loading} className="btn-primary w-full py-4">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Traitement...</> : `Retirer ${selectedCrypto}`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
