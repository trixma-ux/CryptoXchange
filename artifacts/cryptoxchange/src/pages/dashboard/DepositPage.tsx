import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { paymentsAPI, transactionsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, Copy, CheckCircle, Smartphone, Building2, Bitcoin } from 'lucide-react';

const METHODS = [
  { id: 'mobile_money', label: 'Mobile Money', icon: Smartphone, desc: 'Orange Money, MTN, Wave, Moov' },
  { id: 'bank_transfer', label: 'Virement bancaire', icon: Building2, desc: 'Virement SEPA ou local' },
  { id: 'crypto', label: 'Crypto directe', icon: Bitcoin, desc: 'Dépôt de cryptomonnaies' },
];

const MOBILE_PROVIDERS = ['orange_money', 'mtn_money', 'wave', 'moov_money', 'airtel_money'];
const MOBILE_LABELS: Record<string, string> = { orange_money: 'Orange Money', mtn_money: 'MTN Money', wave: 'Wave', moov_money: 'Moov Money', airtel_money: 'Airtel Money' };
const CRYPTOS = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'LTC'];

export default function DepositPage() {
  const [method, setMethod] = useState('mobile_money');
  const [provider, setProvider] = useState('orange_money');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleMobileMoneyDeposit = async () => {
    if (!amount || !phone) { toast.error('Remplissez tous les champs'); return; }
    setLoading(true);
    try {
      const r = await paymentsAPI.mobileMoneyDeposit({ provider, phone, amount: Number(amount) });
      setSuccess(r.data?.data);
      toast.success('Demande de dépôt envoyée !');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors du dépôt');
    } finally { setLoading(false); }
  };

  const handleCryptoDeposit = async () => {
    setLoading(true);
    try {
      const r = await transactionsAPI.cryptoDeposit({ currency: selectedCrypto });
      setSuccess(r.data?.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur');
    } finally { setLoading(false); }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    toast.success('Adresse copiée !');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout title="Dépôt">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Effectuer un Dépôt</h2>
          <p style={{ color: '#94a3b8' }}>Choisissez votre méthode de dépôt</p>
        </div>

        {/* Method Selector */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {METHODS.map(({ id, label, icon: Icon, desc }) => (
            <button key={id} onClick={() => { setMethod(id); setSuccess(null); }}
              className="p-4 rounded-2xl text-left transition-all"
              style={{ background: method === id ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${method === id ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer' }}>
              <Icon className="w-6 h-6 mb-2" style={{ color: method === id ? '#fbbf24' : '#94a3b8' }} />
              <div className="text-sm font-bold" style={{ color: method === id ? '#fbbf24' : 'white' }}>{label}</div>
              <div className="text-xs mt-1" style={{ color: '#64748b' }}>{desc}</div>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Mobile Money */}
          {method === 'mobile_money' && (
            <motion.div key="mobile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#cbd5e1' }}>Opérateur Mobile Money</label>
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
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ex: 50000" className="input-field" />
                <div className="flex gap-2 mt-2">
                  {[5000, 10000, 25000, 50000, 100000].map(v => (
                    <button key={v} onClick={() => setAmount(String(v))}
                      className="text-xs px-3 py-1 rounded-lg transition-colors"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>
                      {v.toLocaleString('fr-FR')}
                    </button>
                  ))}
                </div>
              </div>
              {success ? (
                <div className="p-5 rounded-xl text-center" style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <CheckCircle className="w-10 h-10 mx-auto mb-2" style={{ color: '#10b981' }} />
                  <div className="font-bold text-white mb-1">Demande envoyée !</div>
                  <div className="text-sm" style={{ color: '#94a3b8' }}>Confirmez le paiement sur votre téléphone.</div>
                  {success.reference && <div className="text-xs mt-2 font-mono" style={{ color: '#64748b' }}>Réf: {success.reference}</div>}
                </div>
              ) : (
                <button onClick={handleMobileMoneyDeposit} disabled={loading} className="btn-primary w-full py-4">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Traitement...</> : `Déposer via ${MOBILE_LABELS[provider]}`}
                </button>
              )}
            </motion.div>
          )}

          {/* Bank Transfer */}
          {method === 'bank_transfer' && (
            <motion.div key="bank" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-6 space-y-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <div className="text-sm font-semibold mb-3" style={{ color: '#93c5fd' }}>Coordonnées bancaires</div>
                {[
                  ['Banque', 'Ecobank Côte d\'Ivoire'],
                  ['IBAN', 'CI77 0001 0601 0605 1234 5678 901'],
                  ['BIC/SWIFT', 'ECOCCIABXXX'],
                  ['Bénéficiaire', 'CryptoXchange SARL'],
                  ['Référence', `DEP-${Date.now()}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#94a3b8' }}>{label}</span>
                    <span className="font-mono font-bold text-white">{value}</span>
                  </div>
                ))}
              </div>
              <div className="text-sm p-3 rounded-lg" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
                ⚠️ Délai de traitement : 1 à 3 jours ouvrés. Contactez le support après virement.
              </div>
            </motion.div>
          )}

          {/* Crypto Deposit */}
          {method === 'crypto' && (
            <motion.div key="crypto" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#cbd5e1' }}>Sélectionnez la crypto</label>
                <div className="flex flex-wrap gap-2">
                  {CRYPTOS.map(c => (
                    <button key={c} onClick={() => { setSelectedCrypto(c); setSuccess(null); }}
                      className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                      style={{ background: selectedCrypto === c ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedCrypto === c ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.05)'}`, color: selectedCrypto === c ? '#fbbf24' : '#94a3b8', cursor: 'pointer' }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              {success ? (
                <div className="space-y-4">
                  <div className="text-sm font-medium" style={{ color: '#cbd5e1' }}>Adresse de dépôt {selectedCrypto}</div>
                  <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="text-sm font-mono break-all text-white mb-3">{success.address}</div>
                    <button onClick={() => copyAddress(success.address)} className="btn-secondary w-full text-sm py-2">
                      {copied ? <><CheckCircle className="w-4 h-4" /> Copié !</> : <><Copy className="w-4 h-4" /> Copier l'adresse</>}
                    </button>
                  </div>
                  <div className="text-xs p-3 rounded-lg" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>
                    ⚠️ N'envoyez que du {selectedCrypto} à cette adresse. Toute autre crypto sera perdue.
                  </div>
                </div>
              ) : (
                <button onClick={handleCryptoDeposit} disabled={loading} className="btn-primary w-full py-4">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Génération...</> : `Obtenir l'adresse ${selectedCrypto}`}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
