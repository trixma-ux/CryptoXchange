import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { adminAPI } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Shield, Bitcoin, LayoutDashboard, TrendingUp, UserCheck, DollarSign, LifeBuoy, LogOut, Landmark, ArrowDownLeft, ArrowUpRight, Loader2, Wallet, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/kyc', label: 'KYC', icon: UserCheck },
  { href: '/admin/transactions', label: 'Transactions', icon: TrendingUp },
  { href: '/admin/caisse', label: 'Caisse', icon: Landmark },
  { href: '/admin/fees', label: 'Commissions', icon: DollarSign },
];

const PROVIDERS = [
  { id: 'orange_money', label: 'Orange Money' },
  { id: 'mtn_money', label: 'MTN Money' },
  { id: 'wave', label: 'Wave' },
  { id: 'moov_money', label: 'Moov Money' },
];

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);
}

function StatCard({ label, value, sub, color, icon: Icon }: any) {
  return (
    <div className="glass-card p-5" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm" style={{ color: '#94a3b8' }}>{label}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '18' }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: '#64748b' }}>{sub}</div>}
    </div>
  );
}

export default function AdminCaissePage() {
  const [pathname] = useLocation();
  const { logout, user } = useAuthStore();
  const qc = useQueryClient();

  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [provider, setProvider] = useState('orange_money');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: caisseData, isLoading } = useQuery({
    queryKey: ['caisse-summary'],
    queryFn: () => adminAPI.getCaisseSummary().then(r => r.data?.data),
    refetchInterval: 30000,
  });

  const caisse = caisseData || {};

  const handleDeposit = async () => {
    if (!amount) { toast.error('Montant requis'); return; }
    setLoading(true);
    try {
      const r = await adminAPI.caisseDeposit({ amount: Number(amount), method, provider, phoneNumber: phone });
      const d = r.data?.data;
      if (d?.paymentUrl) {
        window.open(d.paymentUrl, '_blank');
        toast.success('Paiement CinetPay ouvert dans un nouvel onglet');
      } else {
        toast.success(r.data?.message || 'Caisse alimentée !');
      }
      setAmount(''); qc.invalidateQueries({ queryKey: ['caisse-summary'] });
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setLoading(false); }
  };

  const handleWithdraw = async () => {
    if (!amount || !phone) { toast.error('Montant et numéro requis'); return; }
    setLoading(true);
    try {
      await adminAPI.caisseWithdrawCommission({ amount: Number(amount), method, provider, phoneNumber: phone });
      toast.success('Retrait commission enregistré !');
      setAmount(''); setPhone(''); qc.invalidateQueries({ queryKey: ['caisse-summary'] });
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setLoading(false); }
  };

  const txTypes: Record<string, { label: string; color: string; icon: any }> = {
    DEPOSIT_FIAT: { label: 'Dépôt', color: '#10b981', icon: ArrowDownLeft },
    WITHDRAWAL_FIAT: { label: 'Retrait', color: '#ef4444', icon: ArrowUpRight },
    FEE: { label: 'Commission', color: '#f59e0b', icon: DollarSign },
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#080d1a' }}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 fixed inset-y-0 z-30 py-6 px-4" style={{ backgroundColor: '#0a1020', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            <Bitcoin className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-white text-sm">Admin Panel</span>
        </div>
        <nav className="flex-1 space-y-1">
          {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${pathname === href ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                style={pathname === href ? { background: 'rgba(245,158,11,0.15)', color: '#fbbf24' } : {}}>
                <Icon className="w-4 h-4" />
                {label}
              </div>
            </Link>
          ))}
        </nav>
        <div className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="px-3 py-2 text-xs" style={{ color: '#64748b' }}>
            {user?.email}
          </div>
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2 w-full rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-60 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Grande Caisse</h1>
            <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Pool de liquidité + commissions 2% sur toutes les transactions</p>
          </div>
          <button onClick={() => qc.invalidateQueries({ queryKey: ['caisse-summary'] })} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />) : <>
            <StatCard label="Pool de liquidité" value={fmt(caisse.poolBalance || 0)} sub={`${caisse.pendingWithdrawals || 0} retraits en attente`} color="#6366f1" icon={Wallet} />
            <StatCard label="Total dépôts utilisateurs" value={fmt(caisse.totalDeposits || 0)} sub="FCFA entré dans la caisse" color="#10b981" icon={ArrowDownLeft} />
            <StatCard label="Total retraits payés" value={fmt(caisse.totalWithdrawals || 0)} sub="FCFA sorti de la caisse" color="#ef4444" icon={ArrowUpRight} />
            <StatCard label="Commissions admin (2%)" value={fmt(caisse.totalCommissions || 0)} sub="Disponibles au retrait" color="#f59e0b" icon={DollarSign} />
          </>}
        </div>

        {caisse.poolBalance < 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <div className="font-semibold text-red-400">Attention : Caisse déficitaire</div>
              <div className="text-sm" style={{ color: '#94a3b8' }}>Alimentez la caisse pour pouvoir honorer les retraits utilisateurs.</div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Actions */}
          <div className="glass-card p-6 space-y-5">
            <div className="flex rounded-xl p-1 gap-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
              {([['deposit', '💰 Alimenter la caisse'], ['withdraw', '🏦 Retirer mes commissions']] as const).map(([t, l]) => (
                <button key={t} onClick={() => { setTab(t); setAmount(''); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ background: tab === t ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'transparent', color: tab === t ? 'white' : '#94a3b8', border: 'none', cursor: 'pointer' }}>
                  {l}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === 'deposit' ? (
                <motion.div key="deposit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="text-sm p-3 rounded-lg" style={{ background: 'rgba(99,102,241,0.08)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                    💡 Alimentez la caisse pour que les utilisateurs puissent effectuer leurs retraits.
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#cbd5e1' }}>Méthode</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ id: 'mobile_money', label: '📱 Mobile Money' }, { id: 'bank_transfer', label: '🏛 Virement bancaire' }].map(m => (
                        <button key={m.id} onClick={() => setMethod(m.id)} className="py-2 px-3 rounded-xl text-sm font-medium transition-all"
                          style={{ background: method === m.id ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${method === m.id ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.05)'}`, color: method === m.id ? '#fbbf24' : '#94a3b8', cursor: 'pointer' }}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {method === 'mobile_money' && (
                    <div className="grid grid-cols-2 gap-2">
                      {PROVIDERS.map(p => (
                        <button key={p.id} onClick={() => setProvider(p.id)} className="py-2 px-2 rounded-xl text-xs font-medium transition-all"
                          style={{ background: provider === p.id ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${provider === p.id ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.05)'}`, color: provider === p.id ? '#fbbf24' : '#94a3b8', cursor: 'pointer' }}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {method === 'mobile_money' && (
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+225 07 00 00 00 00" className="input-field" />
                  )}
                  <div>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Montant en FCFA" className="input-field text-xl font-mono" />
                    <div className="flex gap-2 mt-2">
                      {[100000, 500000, 1000000, 5000000].map(v => (
                        <button key={v} onClick={() => setAmount(String(v))} className="text-xs px-3 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>
                          {(v / 1000).toFixed(0)}k
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleDeposit} disabled={loading || !amount} className="btn-primary w-full py-4">
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Traitement...</> : `Alimenter la caisse de ${amount ? Number(amount).toLocaleString('fr-FR') : '...'} FCFA`}
                  </button>
                </motion.div>
              ) : (
                <motion.div key="withdraw" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div className="text-sm mb-1" style={{ color: '#94a3b8' }}>Commissions disponibles</div>
                    <div className="text-3xl font-black" style={{ color: '#fbbf24' }}>{fmt(caisse.totalCommissions || 0)}</div>
                    <div className="text-xs mt-1" style={{ color: '#64748b' }}>2% sur toutes les transactions complétées</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {PROVIDERS.map(p => (
                      <button key={p.id} onClick={() => setProvider(p.id)} className="py-2 px-2 rounded-xl text-xs font-medium transition-all"
                        style={{ background: provider === p.id ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${provider === p.id ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.05)'}`, color: provider === p.id ? '#fbbf24' : '#94a3b8', cursor: 'pointer' }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Numéro Mobile Money" className="input-field" />
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Montant à retirer (FCFA)" className="input-field text-xl font-mono" />
                  <button onClick={handleWithdraw} disabled={loading || !amount || !phone} className="btn-primary w-full py-4" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Traitement...</> : 'Retirer mes commissions'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Transaction history */}
          <div className="glass-card p-6">
            <h3 className="text-base font-bold text-white mb-4">Mouvements récents</h3>
            {isLoading ? (
              <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
            ) : (caisse.recentTransactions || []).length === 0 ? (
              <div className="text-center py-8" style={{ color: '#94a3b8' }}>Aucun mouvement</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {(caisse.recentTransactions || []).map((tx: any, i: number) => {
                  const cfg = txTypes[tx.type] || { label: tx.type, color: '#94a3b8', icon: DollarSign };
                  const Icon = cfg.icon;
                  const fcfa = parseFloat(tx.fiatAmount || '0');
                  return (
                    <div key={tx.id || i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: cfg.color + '18' }}>
                          <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">{cfg.label}</div>
                          <div className="text-xs" style={{ color: '#64748b' }}>{tx.description?.replace('[Caisse Admin] ', '').replace('[Commission] ', '').slice(0, 40)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold" style={{ color: cfg.color }}>
                          {tx.type === 'WITHDRAWAL_FIAT' ? '−' : '+'}{fmt(fcfa)}
                        </div>
                        <div className="text-xs" style={{ color: '#64748b' }}>{new Date(tx.createdAt).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
